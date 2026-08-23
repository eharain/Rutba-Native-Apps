# Desktop shells

One Electron shell per product, each a thin `main.js` over
[`@rutba/shell-common`](../packages/shell-common/index.js) (window lifecycle +
the sync bridge in a UtilityProcess). The shells load the **unchanged web
apps** from the consumer workspace - offline is a property of the host, not
the app.

| Shell | Web app (consumer/) | App dev port | Bridge port |
|---|---|---|---|
| `pos-desktop` | `sales/apps/pos` | 4002 | 4030 |
| `mail-desktop` | `content/apps/mail` | 4021 | 4031 |
| `studio-desktop` | `content/apps/social` + `packages/video` | 4011 | 4032 |

Ports 4030-4032 are this repo's own band - deliberately outside the ERP's
4000-4023 registry in `consumer/devkit/scripts/rutba_apps.sh`, because the
bridges are never deployed services, same rule as the bridge's own README.

## Dev loop

Electron is intentionally **not pinned** in this scaffold. From the repo root:

```bash
npm install                    # links the workspaces
npm install -D electron        # pins the current release into the root package.json
```

Then, with the consumer API up (`api/core` on :4020) and the web app running
on its dev port with `NEXT_PUBLIC_API_URL` pointed at the bridge
(`http://127.0.0.1:4030/api` for POS):

```bash
npm start --workspace=@rutba/pos-desktop
```

Requires Electron >= 28 (ESM main-process entry).

## Not built yet

The shells today are window + pass-through bridge. The offline behaviour is
bridge phases 2-4 (response cache, SQLite replica via services/core, durable
outbox/replayer) - designed in `../docs/offline-pos-options.md` §10, with the
engine half already shipped in `../packages/sync`. Shell chrome (connectivity
indicator, outbox queue screen, per `02-desktop-shell.md`) and packaging
(installer, updater) are also open.
