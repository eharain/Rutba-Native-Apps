# Rutba Native Apps

Native desktop builds of the Rutba web apps, for Windows tills and workstations that
must keep working when the internet does not.

This repo is repo #8 in the estate map — see [REPOS.md](../REPOS.md) at the workspace
root. It is cloned into `native-apps/` and ignored by the root `rutba` repo, matching
the nested-working-trees model used by the other tiers.

## What lives here

| Path | What it is |
|---|---|
| `packages/sync` | **@rutba/sync** — the offline sync framework: the phase-1 pass-through bridge and the contract-level replication engine. Moved here from `consumer/packages/sync` on 2026-08-23. |
| `apps/rutba-pos-desktop` | Electron shell for the POS (`consumer/sales/apps/pos`) |
| `apps/rutba-mail-desktop` | Electron shell for Mail (`consumer/content/apps/mail`) |
| `apps/rutba-studio-desktop` | Electron shell for Studio / social video tools (`consumer/content/apps/social` + `consumer/packages/video`) |
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
apps\rutba-studio-desktop\run.bat    :: Studio shell: web app :4011 + bridge :4032 + window
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
