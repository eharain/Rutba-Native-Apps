// Shared Electron shell for the Rutba desktop apps.
//
// One shell per product (pos-desktop, mail-desktop, studio-desktop) - see the
// 2026-08-23 amendment in docs/offline-desktop-program/README.md, which
// superseded the one-container decision. What the shells share lives here so
// the per-app main.js stays three lines of configuration.
//
// The two rules this file exists to keep, both from the offline program:
//
//   - The bridge runs in a UtilityProcess, never the main process
//     (docs/offline-pos-options.md §13.1): a crashed bridge must not take the
//     shell down, and the main process must never block on proxy I/O.
//   - The app loaded in the window is the *unchanged web app* pointed at the
//     local bridge. Offline is a property of the host, not the app
//     (docs/offline-desktop-program/README.md, the thesis).

import { app, BrowserWindow, utilityProcess } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * @param {object} opts
 * @param {string} opts.name        window title, e.g. "Rutba POS"
 * @param {string} opts.appUrl      where the web app is served in dev,
 *                                  e.g. http://127.0.0.1:4002
 * @param {number} opts.bridgePort  loopback port for this shell's bridge
 * @param {string} opts.upstream    the real API origin, e.g. http://127.0.0.1:4020
 */
export function startShell({ name, appUrl, bridgePort, upstream }) {
    let bridge = null;

    function startBridge() {
        bridge = utilityProcess.fork(path.join(here, 'bridge-host.js'), [], {
            serviceName: `rutba-bridge:${bridgePort}`,
            env: {
                ...process.env,
                RUTBA_BRIDGE_UPSTREAM: upstream,
                RUTBA_BRIDGE_PORT: String(bridgePort),
                // A single till never opens a port to the shop network
                // (offline-pos-options.md §10.3). LAN exposure is phase 4's
                // decision, and needs this overridden deliberately.
                RUTBA_BRIDGE_HOST: process.env.RUTBA_BRIDGE_HOST ?? '127.0.0.1',
            },
            stdio: 'pipe',
        });
        bridge.stdout?.on('data', (d) => process.stdout.write(`[bridge] ${d}`));
        bridge.stderr?.on('data', (d) => process.stderr.write(`[bridge] ${d}`));
        bridge.on('exit', (code, signal) => {
            process.stderr.write(`[bridge] exited code=${code} signal=${signal}\n`);
            bridge = null;
            // Debounced respawn and a user-visible "offline core stopped"
            // state are shell-chrome work - 02-desktop-shell.md.
        });
    }

    async function createWindow() {
        const win = new BrowserWindow({
            width: 1440,
            height: 900,
            title: name,
            webPreferences: {
                preload: path.join(here, 'preload.cjs'),
                contextIsolation: true,
                nodeIntegration: false,
            },
        });
        await win.loadURL(appUrl);
    }

    app.whenReady().then(() => {
        startBridge();
        createWindow();
    });

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });

    app.on('will-quit', () => {
        bridge?.kill();
        bridge = null;
    });
}
