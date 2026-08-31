<!-- Paths below name work this document designs; nothing in the tree carries them yet. -->
<!-- verify-docs: planned api/mail-accounts.js -->

# 03 - App adoption policies

> **Status: specification only.** How an app joins the desktop, and what each of
> the three v1 apps actually needs. Every mechanism referenced here is specified
> in [`offline-pos-options.md` §§2-5](../offline-pos-options.md#2-the-hard-part-provisional-ids)
> and packaged in [01](01-sync-core.md); this document is about *which* of them
> each app buys.

## The four-layer adoption model

An app does not "get offline support". It sits at a layer, and moves up a layer
when someone decides a specific capability is worth a specific cost.

| Layer | What it gives | Per-app cost |
|---|---|---|
| **L0** - shell + transparent proxy | Runs as a desktop app. Online behaviour identical. Secure-context origin, so camera/mic work. | **zero** |
| **L1** - response cache, GET keyed by (path, params) | Reads what it has already seen, offline. Settings, enums, branch/desk, any list already viewed. | **zero** |
| **L2** - collection mirror via delta feed | Search boxes and arbitrary local queries over real local rows. | opt-in **per collection** |
| **L3** - outbox + provisional ids + ordered replay | Create and edit offline, reconciled on reconnect. | descriptor annotation **per write** |

**L0 and L1 cost nothing per app, and that is the point of the whole design.**
They are properties of the host. An app that does nothing at all gets a desktop
window, a secure origin, and cached reads - without one line of app code, one
descriptor edit, or one new test. This is the direct consequence of the thesis in
[README](README.md#the-thesis-offline-is-a-property-of-the-host-not-the-app): the
seam is already there, so the default is already useful.

L2 and L3 are where cost begins, and both are **declared, not inferred**. L2 is a
collection named in a manifest; L3 is an `offline:` facet on a descriptor method
([§3](../offline-pos-options.md#3-descriptors-declare-offline-policy)). Neither
is a code branch in the app.

The layers are cumulative and ordered. Nothing at L2 works without L1's cache
warming it; nothing at L3 is safe without L2's local reads answering the
read-after-write that follows every offline create.

### Where each v1 app lands

| App | L0 | L1 | L2 | L3 | The one hard thing |
|---|---|---|---|---|---|
| **POS** (`apps/sales/pos`) | ✓ | ✓ | stock items - the one search box that justifies the cost | sales, payments, stock consumption | Replay granularity - settled in [06](06-sync-back-granularity.md) |
| **Mail** (`apps/content/mail`) | ✓ | ✓ | the local IMAP cache | sends, flags, moves | `uid` is only valid with `uidvalidity` |
| **Studio** (`studio/apps/studio`) | ✓ | ✓ | projects + media library | project saves, queued relay hand-offs | Assets are large; the render is already local |

## POS - `apps/sales/pos`

**Defer to [`offline-pos-options.md`](../offline-pos-options.md).** POS is the app
that document was written for, it is the proving ground, and nothing here
restates it. The per-app mapping is
[§12](../offline-pos-options.md#12-amendment-2026-08-13--one-engine-three-apps)'s
first column.

What this document adds is a single pointer, because it is the largest unresolved
design decision in the whole program and it sits inside D4:

> ### The open decision - [§10.5.1](../offline-pos-options.md#105-still-open)
>
> When a sale was rung offline against replica units, should the replayer:
>
> **(a) replay the unit references it captured** - and flag per-unit collisions
> when another till already sold one; or
>
> **(b) degrade the sale to product + quantity** and let
> [`stock-item.allocateSellableUnits`](../../../consumer/api/legacy/strapi/src/api/stock-item/services/stock-item.js)
> (line 555; FEFO, opened-first, product-locked) pick real units at sync?
>
> (b) is strictly less conflict-prone: *"this specific unit was already sold"*
> cannot occur, and what remains is a shortfall on a number - far easier to report
> and settle than a per-unit collision
> ([§9.2](../offline-pos-options.md#92-the-scoping-decision-that-removes-the-hardest-problem)).
> The allocator already does exactly this in production for divisible lines and
> for `attach-divisible` on web orders, and the storefront has never allocated
> units at capture time.
>
> What (b) costs: **it changes what the receipt's line items mean.** A customer
> holding a printed receipt naming unit X, and a database recording unit Y, is a
> real discrepancy even when the money and the count are both right.
>
> **DECIDED 2026-08-14 - (a), with (b) as the repair path.** See
> [`06-sync-back-granularity.md`](06-sync-back-granularity.md). The replayer
> replays the captured references and falls back to the allocator only for a
> reference it cannot honour; **divisible lines stay product+qty**, because they
> already are; **the outbox payload carries both shapes.** Two findings in 06
> outlive the decision: the POS has no state machine (its stock walk is the
> browser client, one `PUT` per unit), and `allocateSellableUnits`' in-process
> mutex does not cover a replaying bridge on a horizontally scaled Strapi.
>
> The cost recorded above - *"it changes what the receipt's line items mean"* -
> **does not hold**, and 06 says why: the printed receipt carries nothing
> unit-specific. The case against (b) is returns, COGS and unit lookup.

The oversell policy *is* decided and does not reopen: the sale **posts**, the
already-sold unit is **not** consumed twice, and the discrepancy is recorded for a
human ([§5](../offline-pos-options.md#5-what-the-server-still-owes-the-proxy)).

## Mail - `apps/content/mail` (:4021)

`apps/content/mail` is M0-M6 built and imports from live IMAP on demand, so an outage
today leaves it with **almost nothing to show**. It has the most to gain from L1
alone.

### The resolution that matters: the server's rule stands

The email program took a deliberate architecture decision, and it is load-bearing:

> **Live-IMAP gateway, import-on-demand.** The ERP does **not** sync or mirror
> mailboxes. […] A message becomes a database row **only when it is linked** to
> something - a person, contact, order, ticket, or a shared-inbox triage action.
> The mail server stays the source of truth […].
> - [`email-program/00-overview-and-roadmap.md`](../../../consumer/docs/todo/email-program/00-overview-and-roadmap.md), the ADR

The same rule is written into the schema itself:
[`mail-message`'s own `info.description`](../../../consumer/api/legacy/strapi/src/api/mail-message/content-types/mail-message/schema.json)
says the row is created *only* via import-on-link or a triage action, and that
"the mailbox stays the source of truth for everything else."

**Offline mail does not overturn this.** The resolution:

> **The desktop caches IMAP locally in its own SQLite. The server's rule stays
> intact.**

The distinction is not a technicality - it is what keeps the decision honest:

| | Server-side `mail_message` row | Desktop IMAP cache |
|---|---|---|
| Created when | A human links or triages the message | The user opens a folder |
| Lives in | The tenant database, backed up, shared, queryable across the ERP | One SQLite file, on one machine, in that install's `userData` |
| Is it a mirror? | No - it is a deliberate import | Yes, and it is allowed to be, because it is not the ERP's data |
| Privacy posture | Only business-relevant mail enters the ERP | Only what this user already read, on this user's own machine |
| Reachable by | Timelines, CRM, helpdesk, reports | This install's Mail window |

The desktop cache is L1/L2 storage, not a content type. It must never be written
back into `mail_message`, and `mail_message` must never be populated from it - the
import path stays exactly what it is.

- [ ] Say this in the cache's own docblock. The next person to read
      "we cache mail locally" alongside "we never mirror mailboxes" will assume
      one of them is stale unless it is written down that both are true.
- [ ] Cache size and retention are bounded and user-visible. An unbounded mail
      cache on a till is how a shop runs out of disk.

### `uid` + `uidvalidity`: the sharp edge

The write surface is **addressed by IMAP UID in the path**. From
[`api/mail-accounts.js`](../../../consumer/packages/api-client/api/mail/mail-accounts.js):

| Line | Route | Offline mode |
|---|---|---|
| 116 | `GET /mail-accounts/:id/messages` | `replica` (L2) |
| 139 | `GET /mail-accounts/:id/messages/:uid` | `replica` |
| 159 | `POST …/messages/:uid/flags` | `queue` |
| 169 | `POST …/messages/:uid/remove` | `queue` |
| 179 | `POST …/messages/:uid/transfer` | `queue` |
| 243-264 | the `bulk-flags` / `bulk-remove` / `bulk-transfer` trio | `queue` |
| 352 | `POST /mail-accounts/:id/send` | `queue` |
| 100 | `GET …/folders` | `replica` |
| 116 (`search` param) | server-side IMAP SEARCH | **`reject`** - see below |

And `mail-message` models the identity honestly:
`imap_uid` is *"Advisory; only valid together with `uidvalidity`"* (schema line 34).

**That advisory note becomes a correctness requirement the moment flags are
queued.** A `setFlags` queued against `uid 4711` and replayed after the folder's
`uidvalidity` changed does not fail - it targets **a different message**. Silently
marking the wrong mail read is worse than refusing to mark anything.

- [ ] Every queued mail write captures **`(account, folder, uidvalidity, uid)`**,
      never `uid` alone. On replay, a `uidvalidity` mismatch is a **conflict**, not
      a retry and not a best-effort write.
- [ ] Prefer `message_id` as the durable identity where the route allows it -
      `mail-message` already treats RFC 5322 `Message-ID` as *"the durable
      identity"* (schema line 22), with `dedupe_hash` (`sha256(date|from|subject|size)`)
      as the fallback when it is absent. The uid is the addressing scheme; the
      Message-ID is the identity. Reconcile on the identity, address with the uid.
- [ ] A `uidvalidity` change **invalidates every cached uid for that folder**.
      That is the cache-bust rule, and it must be explicit rather than emergent.

### Send is the sharpest case for `Idempotency-Key`

[§12](../offline-pos-options.md#12-amendment-2026-08-13--one-engine-three-apps)
already names it, and it is worth repeating where the Mail work will be read:

> A replayed send whose response was lost must not mail the customer twice, and
> **unlike a duplicate row it cannot be repaired afterwards.**

A duplicate sale row is embarrassing and fixable. A duplicate email is delivered.
[04 §3](04-server-prerequisites.md#3-a-generic-idempotency-key-and-a-dedupe-table)
is therefore not a nicety for Mail; it is the precondition for queueing a send at
all.

- [ ] Until `Idempotency-Key` is landed and proven, `send` is `mode: 'reject'` with
      a reason, not `mode: 'queue'`. Shipping queued sends against a
      best-effort dedupe is the one mistake in this program that reaches a
      customer's inbox.

### What Mail must refuse

- [ ] **Search across mail never pulled.** IMAP SEARCH runs on the server
      (the `search` parameter on `listMessages`, line 116). Offline, searching a
      cache and presenting it as a mailbox search is a lie about completeness.
      Refuse, or label the scope unmistakably - *"searching 6 cached folders, not
      your mailbox"*.
- [ ] Anything needing a live IMAP round trip that the cache cannot substitute
      for - [§12](../offline-pos-options.md#12-amendment-2026-08-13--one-engine-three-apps)'s
      `reject` column.

## Studio - `studio/apps/studio` (:4231)

[Rutba Studio](../../../consumer/studio/README.md): the editors, the managed
libraries and the deck designer, over
[`packages/editor-core`](../../../consumer/studio/packages/editor-core). Studio is
the odd one out in the best way.

**Which Studio this is, and what changed.** These policies were first written
against `content/apps/social/pages/posts/video-studio.js` plus
[`consumer/packages/video`](../../../consumer/packages/video) - the video tooling
inside Rutba Social, which is what `rutba-studio-desktop` shelled until
2026-09-01. The shell now loads the standalone product, so this section was
re-read against it. Most of it survives unchanged, because `editor-core` is the
same renderer lifted out of the ERP and the capture dialog is the estate's one
shared component. The two paragraphs where the app matters are marked below.

The social video studio keeps every property described here; it simply has no
desktop shell of its own, and `consumer/studio/EXTRACTION.md` records it as the
surface being ported *into* Studio rather than the other way round.

### Rendering is already 100% local

`@rutba-studio/editor-core` is browser-engine only, zero dependencies - canvas →
`captureStream()` → `MediaRecorder`, **no ffmpeg**. It is the same renderer
`@rutba/video` is, lifted rather than rewritten, so this property did not change
with the app. The heavy part of the workload never touched the network in the
first place. What needs the network is **loading assets** and **saving the
project**.

So Studio's offline story is mostly a caching story, and its L2 is unusually cheap:

- [ ] Project documents: `replica`, and small.
- [ ] **Assets cached by URL.** They are large and **immutable**, so cache-by-url
      beats a delta feed outright - no cursor, no tombstones, no staleness
      handling ([§12](../offline-pos-options.md#12-amendment-2026-08-13--one-engine-three-apps)).
      This is the one collection in the program that should *not* use the
      replicator.
- [ ] Bound the asset cache and make eviction visible. Video assets will dwarf
      everything else on disk.

### The desktop is what gives Studio its recorder back

Covered in [02 §The secure-context dividend](02-desktop-shell.md#the-secure-context-dividend--this-is-what-fixes-lan-capture),
and it is Studio's biggest single win from this program - larger than offline
itself. In-browser capture is currently impossible on the LAN deploy box because
`getUserMedia` is undefined at a plain-http LAN origin. The desktop's
`http://127.0.0.1` origin is a secure context, so the recorder works.

Unchanged by the repoint, and if anything larger: the dividend is paid in
`@rutba/ui/components/RecorderDialog`, the estate's one capture surface, and
Studio has **two** doors onto it -
[`components/editor/RecordBar.js`](../../../consumer/studio/apps/studio/components/editor/RecordBar.js)
puts a take straight onto the creative at the playhead, and
[`components/RecordButton.js`](../../../consumer/studio/apps/studio/components/RecordButton.js)
records into a library. Both are dead on a LAN origin today.

### Reproducibility: fixed in the social pages, and not a residue in Studio

The editor plan recorded the original problem:

> *"Settings are per-browser (`localStorage`), so a render is not reproducible from
> the post, and the poster can't honour choices made in the studio."*
> - `video-studio-editor-plan.md:66`

> **A correction worth recording.** That describes the pre-v4 state, and it has
> largely been fixed. `social-post.video_settings` (json) exists on the schema,
> and the studio writes the full recipe to it - `saveRecipe` at
> [`video-studio.js:1735`](../../../consumer/content/apps/social/pages/posts/video-studio.js)
> persists `{ template, options, layers, savedAt }` so *"re-opening the post
> restores exactly this state"* and *"the poster reproduces this render"*
> (line 737). Do not spec this as outstanding work.

What remains in social's `localStorage` is the **last-used default for new
posts** (`SETTINGS_KEY`, lines 252 and 257) plus pure UI chrome (`:guides`,
`:railHidden`). On a desktop host, "per-browser" would become **"per-install"** -
two machines starting a new post from different defaults, neither wrong, with no
way to tell from the post which happened.

**This is the first paragraph the repoint changes, and it changes it to
nothing.** The standalone Studio app writes no `localStorage` at all - not a
default, not UI chrome - and its equivalent of the recipe is the project
document on `studio_projects`, server-side by construction, which is also what
the render worker resolves. So the residue this section was written to flag does
not exist in the app the shell now hosts. It is still true of the social pages,
and it is why the item below is kept rather than deleted.

- [ ] Only if the social video studio is ever shelled: smaller than the original
      problem, same shape. Either promote the new-post default to a server-side
      setting, or make it visible in the editor so a diverging default is
      discoverable. Do not leave it silent.
- [ ] Renders produced offline are attributed to the install that produced them,
      so a divergent output is traceable to a machine rather than argued about.

### What Studio must refuse

- [ ] **Publishing to a social provider.** A live third-party call the bridge
      cannot substitute for
      ([§12](../offline-pos-options.md#12-amendment-2026-08-13--one-engine-three-apps)).
      Queue the *intent* - the post moves to a scheduled/queued state the user can
      see - but never report a publish that did not happen.
- [ ] Replayed renders are the **cheapest** conflict case in the program: a
      duplicated render wastes CPU, not money or trust. Do not spend D4 effort
      making them exactly-once.

### The second paragraph the repoint changes: two paths the bridge never sees

The refusal above assumed the publish leaves from the browser, because in the
social app it does. In the standalone Studio it does not, and neither does the
media fetch. Both run **in the app's own Next server process**:

| Route | What it does | Why it is server-side |
|---|---|---|
| [`pages/api/relay/[action].js`](../../../consumer/studio/apps/studio/pages/api/relay/%5Baction%5D.js) | `POST /v1/posts` and `GET /v1/platforms` against the Social Relay | the relay API key is a tenant credential; anything the browser can read is public |
| [`pages/api/media-proxy.js`](../../../consumer/studio/apps/studio/pages/api/media-proxy.js) | streams Media FileServer bytes back same-origin | a canvas that drew a cross-origin image is tainted and `captureStream()` throws |

`NEXT_PUBLIC_API_URL` points the *browser* at the bridge. It does not move these,
and nothing else does either - a request the app makes from its own server goes
straight out. So:

- [ ] The queue-the-intent refusal above has to be enforced **in the relay route**,
      not only in shell chrome. A page that cannot reach the network still calls
      this route, and the route is the thing that fails.
- [ ] L1's "assets cached by URL" has to be a cache **the media proxy consults**,
      not a bridge response cache, or the one collection this document singled
      out as the cheapest to cache is the one the bridge cannot see.

The third server route, [`pages/api/share/[token].js`](../../../consumer/studio/apps/studio/pages/api/share/%5Btoken%5D.js),
is the exception that shows the rule: it resolves
`API_URL || NEXT_PUBLIC_API_URL`, so under the shell it reaches the engine
*through* the bridge - server process to loopback bridge - and gets L1 for free
like any browser call. The other two resolve **different services**:
`RELAY_API_URL` for the relay, `MEDIA_BASE_URL` for the bytes. That is why they
escape, and it is a property of the upstream they name rather than of being
server-side.

The media proxy is the mixed case and worth reading closely: its allowlist and
its foreign-track check both go through `NEXT_PUBLIC_API_URL`, so those cross the
bridge, while the media bytes themselves do not.

## Adding a fourth app later

The model exists so that the next app is a configuration, not a port. What it
costs, in order:

1. **L0 + L1: nothing.** Bundle it, and it has a window, a secure origin and
   cached reads.
2. **L2:** name its collections in the manifest, and confirm its read routes are
   ported in services/core. Unported custom actions answer 501 - that is the real
   ceiling ([04 §The offline-readiness gate](04-server-prerequisites.md#the-offline-readiness-gate)).
3. **L3:** annotate its write descriptors with `offline:`, decide its refusals up
   front, and pay for whatever `mints` / `group` ordering its flows need.

**Rider, inventory and manufacturing are the strong later candidates** - a
delivery van, a warehouse aisle and a stitching floor are places where
connectivity genuinely fails, which is a better argument than any v1 app makes
for itself. They are out of scope now, and the reason to write the layers down
today is that phases D1-D4 must not bake in assumptions that make the fourth app
a rewrite.
