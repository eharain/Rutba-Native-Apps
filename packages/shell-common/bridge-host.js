// UtilityProcess entry: hosts the @rutba/sync bridge off the main process.
//
// Spawned by shell-common's startShell(). This file deliberately does as
// little as a bin/ script does - createBridge is a library, and everything
// process-shaped lives at the edges (packages/sync README, "library with a
// thin CLI"; the UtilityProcess is the other edge).

const { createBridge } = await import('@rutba/sync');

const bridge = createBridge({
    upstream: process.env.RUTBA_BRIDGE_UPSTREAM ?? 'http://127.0.0.1:4020',
    port: Number(process.env.RUTBA_BRIDGE_PORT ?? 4030),
    host: process.env.RUTBA_BRIDGE_HOST ?? '127.0.0.1',
    log: process.env.RUTBA_BRIDGE_LOG ?? 'summary',
});

await bridge.listen();
console.log(`bridge listening at ${bridge.url}, upstream ${process.env.RUTBA_BRIDGE_UPSTREAM}`);

// The bridge's later phases (replica + outbox) are wired in here as they land:
// this process is where services/core-on-SQLite will run too (01-sync-core.md).
