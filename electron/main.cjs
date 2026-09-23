// Electron main process. Kept as CommonJS (despite the rest of the project
// being ESM) so `require('menubar')` and friends need no interop games; the
// ESM backend is pulled in with a dynamic import(), which works fine from CJS.
const path = require("node:path");
const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const { menubar } = require("menubar");
const { loginWithClaude } = require("./claudeLogin.cjs");

const PORT = process.env.PORT || 4173;
const PRELOAD = path.join(__dirname, "preload.cjs");

let dashboardWindow = null;

function openDashboardWindow() {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.focus();
    return;
  }
  dashboardWindow = new BrowserWindow({
    width: 980,
    height: 720,
    title: "Claude Usage",
    webPreferences: { preload: PRELOAD, contextIsolation: true },
  });
  dashboardWindow.loadURL(`http://localhost:${PORT}/`);
}

async function main() {
  const { startServer } = await import("../backend/src/server.js");
  await startServer(PORT);

  if (process.platform === "darwin") app.dock?.hide();

  ipcMain.handle("claude-login", () => loginWithClaude());
  ipcMain.handle("open-dashboard", () => openDashboardWindow());

  const mb = menubar({
    index: `http://localhost:${PORT}/tray`,
    icon: path.join(__dirname, "..", "assets", "trayIconTemplate.png"),
    browserWindow: {
      width: 340,
      height: 480,
      resizable: false,
      webPreferences: { preload: PRELOAD, contextIsolation: true },
    },
    tooltip: "Claude Usage",
  });

  mb.on("ready", () => {
    mb.tray.on("right-click", () => {
      const menu = Menu.buildFromTemplate([
        { label: "Open dashboard", click: openDashboardWindow },
        { type: "separator" },
        { label: "Quit Claude Usage", click: () => app.quit() },
      ]);
      mb.tray.popUpContextMenu(menu);
    });
  });

  // The popover's window is created once and only ever shown/hidden after
  // that, so its React app never remounts — tell it to refetch every time
  // it's opened instead of leaving it stuck with whatever it first loaded.
  mb.on("show", () => {
    mb.window?.webContents.send("tray-shown");
  });
}

main();
