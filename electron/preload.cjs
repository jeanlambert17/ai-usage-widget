const { contextBridge, ipcRenderer } = require("electron");

// The renderer (our React app) checks for `window.electronAPI` to decide
// whether it can offer "log in with Claude" or must fall back to the manual
// paste-a-session-key flow (see features/accounts/components/ConnectAccountDialog.tsx).
contextBridge.exposeInMainWorld("electronAPI", {
  claudeLogin: () => ipcRenderer.invoke("claude-login"),
  openDashboard: () => ipcRenderer.invoke("open-dashboard"),
  // The tray popover's window is never destroyed between opens (menubar
  // just shows/hides it), so it can't rely on remounting to pick up fresh
  // data — this tells it "you were just opened, go refetch now."
  onTrayShown: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("tray-shown", listener);
    return () => ipcRenderer.removeListener("tray-shown", listener);
  },
});
