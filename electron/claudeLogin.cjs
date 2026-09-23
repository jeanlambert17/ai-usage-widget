const { BrowserWindow, session } = require("electron");

// One persistent partition reused across every login attempt. The point is
// that Google/claude.ai should recognize this as a returning browser after
// the first successful login, instead of treating it as a brand-new device
// every time (which is what a fresh ephemeral partition per attempt caused).
// It's still an isolated profile that only this app's login window ever
// uses — never your real Chrome/Safari profile or its cookies.
const LOGIN_PARTITION = "persist:claude-login";

// Electron's default UA advertises itself as Electron, which Google's login
// flow blocks outright ("This browser or app may not be secure") even
// though it's the same Chromium engine and a human is doing the actual
// clicking/typing. Presenting as a normal desktop Chrome avoids that block.
const DESKTOP_CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function loginWithClaude() {
  return new Promise((resolve, reject) => {
    const ses = session.fromPartition(LOGIN_PARTITION);
    const win = new BrowserWindow({
      width: 480,
      height: 720,
      title: "Log in to Claude",
      webPreferences: { session: ses },
    });
    win.webContents.setUserAgent(DESKTOP_CHROME_UA);

    let settled = false;
    let pollTimer = null;

    const finish = (err, result) => {
      if (settled) return;
      settled = true;
      if (pollTimer) clearInterval(pollTimer);
      win.removeAllListeners();
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
    win.webContents.on("did-finish-load", checkForSessionCookie);
    pollTimer = setInterval(checkForSessionCookie, 1000);

    win.on("closed", () => finish(new Error("Login window closed before completing sign-in.")));

    // Forget only claude.ai's own session cookie before each attempt — Google's
    // session in this partition is left alone. Otherwise, once you're logged
    // into one Claude account here, every later "Log in with Claude" (e.g. to
    // add a *second* account) would silently hand back that same account
    // instead of letting claude.ai prompt for which one to use.
    ses.cookies
      .remove("https://claude.ai", "sessionKey")
      .catch(() => {})
      .finally(() => win.loadURL("https://claude.ai/login"));
  });
}

module.exports = { loginWithClaude };
