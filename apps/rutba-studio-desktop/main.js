// Rutba Studio - Windows desktop shell.
// Shells the unchanged web app (consumer/studio/apps/studio, dev :4231) and
// hosts the sync bridge on loopback :4032. Point the app's
// NEXT_PUBLIC_API_URL at http://127.0.0.1:4032/api when running under this
// shell.
//
// This shell pointed at consumer/content/apps/social (:4011) until 2026-09-01,
// which was the video tooling inside Rutba Social, not the product this shell
// is named for. Studio became an application of its own during the August 2026
// extraction - manifest key `studio`, unit `rutba_studio`, entitled by
// `social.studio` - and that is what a build called Studio must carry.

import { startShell } from '@rutba/shell-common';

startShell({
    name: 'Rutba Studio',
    appUrl: process.env.RUTBA_STUDIO_URL ?? 'http://127.0.0.1:4231',
    bridgePort: Number(process.env.RUTBA_BRIDGE_PORT ?? 4032),
    upstream: process.env.RUTBA_BRIDGE_UPSTREAM ?? 'http://127.0.0.1:4020',
});
