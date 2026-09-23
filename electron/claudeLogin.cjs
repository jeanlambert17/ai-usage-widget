const { BrowserWindow, session } = require("electron");

// Opens a real claude.ai login page in its own throwaway browser session and
// waits for the user to finish logging in however they normally would
// (Google SSO, email OTP, whatever) — we never see credentials, only the
// resulting sessionKey cookie once it appears. The session is in-memory
// (no "persist:" prefix) and is wiped when the window closes.
function loginWithClaude() {
  return new Promise((resolve, reject) => {
    const ses = session.fromPartition(`claude-login-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const win = new BrowserWindow({
      width: 480,
      height: 720,
      title: "Log in to Claude",
      webPreferences: { session: ses },
    });

    let settled = false;
    let pollTimer = null;

    const finish = (err, result) => {
      if (settled) return;
      settled = true;
      if (pollTimer) clearInterval(pollTimer);
      win.removeAllListeners();
      ses.clearStorageData().catch(() => {});
      if (!win.isDestroyed()) win.close();
      if (err) reject(err);
      else resolve(result);
    };

    async function checkForSessionCookie() {
      try {
        const cookies = await ses.cookies.get({ domain: "claude.ai", name: "sessionKey" });
        if (cookies[0]) finish(null, { sessionKey: cookies[0].value });
      } catch {
        // window may already be closing; ignore and let the close handler fire
      }
    }

    win.webContents.on("did-navigate", checkForSessionCookie);
    win.webContents.on("did-navigate-in-page", checkForSessionCookie);
    pollTimer = setInterval(checkForSessionCookie, 1000);

    win.on("closed", () => finish(new Error("Login window closed before completing sign-in.")));

    win.loadURL("https://claude.ai/login");
  });
}

module.exports = { loginWithClaude };
