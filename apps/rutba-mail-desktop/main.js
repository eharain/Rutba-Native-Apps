// Rutba Mail - Windows desktop shell.
// Shells the unchanged web app (consumer/content/apps/mail, dev :4021) and
// hosts the sync bridge on loopback :4031. Point the app's
// NEXT_PUBLIC_API_URL at http://127.0.0.1:4031/api when running under this
// shell.

import { startShell } from '@rutba/shell-common';

startShell({
    name: 'Rutba Mail',
    appUrl: process.env.RUTBA_MAIL_URL ?? 'http://127.0.0.1:4021',
    bridgePort: Number(process.env.RUTBA_BRIDGE_PORT ?? 4031),
    upstream: process.env.RUTBA_BRIDGE_UPSTREAM ?? 'http://127.0.0.1:4020',
});
