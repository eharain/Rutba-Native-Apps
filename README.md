# Rutba Native Apps

Native desktop builds of the Rutba web apps, for Windows tills and workstations that
must keep working when the internet does not.

This repo is repo #7 in the estate map — see [REPOS.md](../REPOS.md) at the workspace
root. It is cloned into `native-apps/` and ignored by the root `rutba` repo, matching
the nested-working-trees model used by the other tiers. (It was #8 while
`rutba-portal` was still counted separately; that tree belongs to
`rutba-management` and the estate is seven repos.)

## What lives here

| Path | What it is |
|---|---|
| `packages/sync` | **@rutba/sync** — the offline sync framework: the phase-1 pass-through bridge and the contract-level replication engine. Moved here from `consumer/packages/sync` on 2026-08-23. |
| `apps/rutba-pos-desktop` | Electron shell for the POS (`consumer/sales/apps/pos`) |
| `apps/rutba-mail-desktop` | Electron shell for Mail (`consumer/content/apps/mail`) |
| `apps/rutba-studio-desktop` | Electron shell for Rutba Studio (`consumer/studio/apps/studio`, dev :4231) |
| `docs/` | The offline/desktop program: [offline-pos-options.md](docs/offline-pos-options.md) and [offline-desktop-program/](docs/offline-desktop-program/), moved from `consumer/docs/todo/` on 2026-08-23. |

## Design lineage

The working design is [docs/offline-pos-options.md](docs/offline-pos-options.md) §§1-5
and §10, generalized by [docs/offline-desktop-program/](docs/offline-desktop-program/README.md).
Both documents were written against the consumer tree; relative links into `consumer/…`
paths resolve against a full workspace checkout (`d:\Rutba2.0`), not against this repo
alone.

## Superseded decision

The program's original **decision 1** ("one Rutba Desktop container hosting many apps")
was superseded on 2026-08-23: the estate ships **one Electron shell per product**
(`rutba-pos-desktop`, `rutba-mail-desktop`, `rutba-studio-desktop`) over shared packages. See
[docs/offline-desktop-program/README.md](docs/offline-desktop-program/README.md) for the
recorded amendment.

## The studio shell now shells Studio

`rutba-studio-desktop` shelled the **social** app in the content group at :4011
until 2026-09-01, which is what existed when it was written. Rutba Studio became
an app of its own during the August 2026 extraction — `consumer/studio/apps/studio`
at :4231, manifest key `studio`, entitled by `social.studio` — and the shell was
repointed there, because a desktop build named for a product should carry that
product. `RUTBA_STUDIO_URL` overrides the default, so the social surface is still
reachable from this shell for anyone who wants it.

The shell asks little of the app it hosts, which is what made the move cheap: a
Next app on a loopback port whose `NEXT_PUBLIC_API_URL` points at the bridge, and
the core engine on :4020 behind it. Studio meets that the same way Social does —
the same `@rutba/api-client` descriptors, the same `@rutba/ui` auth context and
`pages/auth/callback.js`, no server-rendered data fetch — and the studio module's
`/api/v1/*` alias exists for exactly the `/api` base the bridge hands it.

Two of Studio's outbound paths do **not** cross the bridge, and the offline
program should not assume they do: `pages/api/media-proxy.js` and
`pages/api/relay/[action].js` run in the app's own Node process, so bytes from
the Media FileServer and the hand-off to the Social Relay leave the machine
without the bridge ever seeing them. That is a scope note for bridge phases 2-4,
not a blocker for the window.

## Status

- `@rutba/sync`: bridge phase 1 (pass-through proxy) done and verified; engine
  read + plan + apply done and verified. Bridge phases 2-4 (response cache, SQLite
  replica, outbox/replayer) are designed, not built.
- Shells: scaffolded (window + pass-through bridge); offline behaviour lands with
  bridge phases 2-4.

## One-click build & run

```bat
native-build.bat                     :: install workspaces (+ Electron, first run)
apps\rutba-pos-desktop\run.bat       :: POS shell:    web app :4002 + bridge :4030 + window
apps\rutba-mail-desktop\run.bat      :: Mail shell:   web app :4021 + bridge :4031 + window
apps\rutba-studio-desktop\run.bat    :: Studio shell: web app :4231 + bridge :4032 + window
```

Or from anywhere in the estate, the same convention as `dev.cmd` / `rutba.cmd`:

```bat
native-apps build | test | pos | mail | studio
```

A `run.bat` starts its web app (pointed at its own bridge via
`NEXT_PUBLIC_API_URL`), then the Electron shell which hosts the bridge in a
UtilityProcess. Prerequisite: the consumer API up (`api/core` on :4020) —
`consumer\devkit\dev-start-core.bat` covers it.

## Tests

```bash
npm install
npm test
```

## License

Dual-licensed under the GNU AGPL v3.0 (see [LICENSE](LICENSE)) and a
separate commercial license — see [COMMERCIAL-LICENSE.md](COMMERCIAL-LICENSE.md).
Copyright (C) 2026 Tech Style Ltd — https://tech-style.co
