// Rutba Studio - Windows desktop shell.
// Shells the unchanged web app (consumer/content/apps/social + packages/video,
// dev :4011) and hosts the sync bridge on loopback :4032. Point the app's
// NEXT_PUBLIC_API_URL at http://127.0.0.1:4032/api when running under this
// shell.

import { startShell } from '@rutba/shell-common';

startShell({
    name: 'Rutba Studio',
    appUrl: process.env.RUTBA_STUDIO_URL ?? 'http://127.0.0.1:4011',
    bridgePort: Number(process.env.RUTBA_BRIDGE_PORT ?? 4032),
    upstream: process.env.RUTBA_BRIDGE_UPSTREAM ?? 'http://127.0.0.1:4020',
});
