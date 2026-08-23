// Preload for the Rutba desktop shells. Sandboxed, so CommonJS it is.
//
// The app in the window is the unchanged web app - it must not grow a
// desktop branch. What legitimately crosses the bridge is shell chrome:
// connectivity state and the outbox queue, read from GET /bridge/status
// (02-desktop-shell.md, "Connectivity and the queue live in shell chrome").

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('rutbaShell', {
    platform: process.platform,
});
