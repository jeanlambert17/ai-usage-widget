const { contextBridge, ipcRenderer } = require("electron");

// The renderer (our React app) checks for `window.electronAPI` to decide
// whether it can offer "log in with Claude" or must fall back to the manual
// paste-a-session-key flow (see features/accounts/components/ConnectAccountDialog.tsx).
contextBridge.exposeInMainWorld("electronAPI", {
  claudeLogin: () => ipcRenderer.invoke("claude-login"),
  openDashboard: () => ipcRenderer.invoke("open-dashboard"),
});
