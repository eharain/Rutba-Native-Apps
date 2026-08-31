# Desktop shells

One Electron shell per product, each a thin `main.js` over
[`@rutba/shell-common`](../packages/shell-common/index.js) (window lifecycle +
the sync bridge in a UtilityProcess). The shells load the **unchanged web
apps** from the consumer workspace - offline is a property of the host, not
the app.

| Shell | Web app (consumer/) | App dev port | Bridge port |
|---|---|---|---|
| `rutba-pos-desktop` | `sales/apps/pos` | 4002 | 4030 |
| `rutba-mail-desktop` | `content/apps/mail` | 4021 | 4031 |
| `rutba-studio-desktop` | `studio/apps/studio` | 4231 | 4032 |

Ports 4030-4032 are this repo's own band - deliberately outside the app ports
registered in `consumer/config/apps.manifest.json` and listed by
`consumer/devkit/scripts/rutba_apps.sh`, because the bridges are never deployed
services, same rule as the bridge's own README. (Those app ports are not one
contiguous run: the consumer line sits in 4000-4023 and the standalone products have
bands of their own, which is where Studio's 4231 comes from.)

**`rutba-studio-desktop` pointed at `content/apps/social` (:4011) until
2026-09-01.** That was the video tooling inside Rutba Social - a feature of a
different product (`erp.social`), not the product this shell is named for.
Rutba Studio became an application of its own during the August 2026
extraction: manifest key `studio`, unit `rutba_studio`, port 4231, entitled by
`social.studio`, with its own editors, libraries and deck designer. The shell
now loads it. `RUTBA_STUDIO_URL` still overrides the default, so the old
surface is one environment variable away for anyone who wants it.

The social video studio is not orphaned by this - it is still a shipping page
of a shipping app, and `consumer/studio/EXTRACTION.md` records it as the thing
being ported *into* Studio rather than the other way round. What it does not
have is a desktop product of its own, and it never had one under this name.

## Dev loop

One click per shell:

```bat
rutba-pos-desktop\run.bat     :: web app :4002 + bridge :4030 + window
rutba-mail-desktop\run.bat    :: web app :4021 + bridge :4031 + window
rutba-studio-desktop\run.bat  :: web app :4231 + bridge :4032 + window
```

`run.bat` (via [`scripts\run-shell.bat`](scripts/run-shell.bat)) starts the web
app on its dev port with `NEXT_PUBLIC_API_URL` pointed at the shell's own bridge,
then starts Electron. If the app is already listening, it is reused as-is.

Prerequisites, once each: the consumer API up (`api/core` on :4020 -
`consumer\devkit\dev-start-core.bat` covers it), and Electron installed -
[`..\native-build.bat`](../native-build.bat) does both the workspace install and
the (first-run) Electron install.

Requires Electron >= 28 (ESM main-process entry).

## Not built yet

The shells today are window + pass-through bridge. The offline behaviour is
bridge phases 2-4 (response cache, SQLite replica via services/core, durable
outbox/replayer) - designed in `../docs/offline-pos-options.md` §10, with the
engine half already shipped in `../packages/sync`. Shell chrome (connectivity
indicator, outbox queue screen, per `02-desktop-shell.md`) and packaging
(installer, updater) are also open.
