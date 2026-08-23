// Rutba POS - Windows desktop shell.
// Shells the unchanged web app (consumer/sales/apps/pos, dev :4002) and hosts
// the sync bridge on loopback :4030. Point the app's NEXT_PUBLIC_API_URL at
// http://127.0.0.1:4030/api when running under this shell.

import { startShell } from '@rutba/shell-common';

startShell({
    name: 'Rutba POS',
    appUrl: process.env.RUTBA_POS_URL ?? 'http://127.0.0.1:4002',
    bridgePort: Number(process.env.RUTBA_BRIDGE_PORT ?? 4030),
    upstream: process.env.RUTBA_BRIDGE_UPSTREAM ?? 'http://127.0.0.1:4020',
});
