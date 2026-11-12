// Ensure Electron is launched as Electron, not as Node, even when running
// from environments (like VS Code, Antigravity, or child processes) that set ELECTRON_RUN_AS_NODE=1.
delete process.env.ELECTRON_RUN_AS_NODE;

/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  workers: 1,
  testDir: './tests',
  timeout: 30000
};
