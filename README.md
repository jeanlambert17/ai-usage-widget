# AI Usage — multi-account, multi-provider usage dashboard

A dashboard that shows AI usage — session/weekly quota today, more later —
for as many accounts as you connect, side by side. Built around a provider
registry: **Claude is the only implemented provider today**, but "Connect
account" is already a provider menu, and adding ChatGPT/Gemini later means
adding a `backend/features/<provider>/` module, not a redesign.

## Why this exists / how Claude usage data is obtained

There is no official public API for a Claude.ai Pro/Max/Team subscriber's
usage quota (see `DISCUSSION.md` for the full research). The only place that
data lives is an internal endpoint claude.ai's own web client calls:

```
GET https://claude.ai/api/organizations/{orgId}/usage
```

authenticated with the `sessionKey` cookie from a logged-in browser session —
equivalent to being logged in as that account. This app speaks that same
protocol directly. Nothing is ever sent anywhere except `claude.ai`.

**This is an unofficial, reverse-engineered endpoint** and can change or
break without notice.

## Architecture

An npm workspace with two packages plus a thin desktop shell:

```
backend/            Express API (@ai-usage-snippet/backend)
  src/                 globals: app assembly, server bootstrap, config, generic lib (JSON file store, error types)
  features/
    providers/           the provider registry ("Connect account" menu source)
    claude/               Claude's client (the fetch calls above) + its provider adapter
    accounts/             connect/list/disconnect, persisted to backend/data/accounts.json
    usage/                dispatches each account to its provider's getUsage()

frontend/            React + Vite + shadcn/ui (Base UI style "lyra", preset b3lCYuWxM)
  src/                 globals: entry point, router, theme provider, api fetch helper, shadcn primitives (components/ui)
  features/
    providers/            provider list types/api
    accounts/              connect dialog (provider menu -> per-provider connect step), account card, hooks
    usage/                 usage bar component, formatting, polling hook
    dashboard/              the full-page view (route "/")
    tray/                   the compact popover view (route "/tray")

electron/            Desktop shell: starts the backend in-process, hosts a tray
  main.cjs              popover + full-dashboard window, and the Claude login capture flow
  preload.cjs           exposes window.electronAPI to the frontend
  claudeLogin.cjs        opens a real claude.ai login page, captures the resulting cookie
```

The backend serves the frontend's built static files itself (`backend/src/app.js`),
so in both Docker and the plain web mode there's exactly one process and one
port. Electron just adds a tray icon and window chrome around that same
backend + frontend.

## Connecting an account

Click **+ Connect account** → pick a provider (only Claude is available
today; others show "Coming soon"). What happens next depends on how you're
running the app:

- **In the tray/desktop app:** click "Log in with Claude" — a real browser
  window opens on claude.ai's actual login page. Log in however you normally
  would (Google SSO, email OTP, whatever). Your password never touches this
  app's code; the app only reads the resulting session cookie once login
  succeeds, then discards that login window's browser session entirely.
- **In a plain browser tab (e.g. the Docker-served dashboard):** there's no
  way for a webpage to pop a native login window or read another site's
  cookies — that's a basic browser security boundary, not a missing feature.
  You'll get a manual fallback instead: paste the `sessionKey` cookie value
  copied from your own browser's DevTools (Application/Storage → Cookies →
  `https://claude.ai`).

If the account belongs to multiple organizations (e.g. a personal workspace
and a Team), one card is created per organization automatically. The
dashboard polls every 60 seconds; there's also a manual refresh button.

## Run it

**As a menu-bar tray app (recommended):**

```
npm install   # first time only, installs both workspaces + electron/menubar
npm run tray
```

A usage-bars icon appears in your menu bar. Click it for the compact
popover; right-click it to quit or open the full dashboard window. No dock
icon — this is tray-only.

**As a plain local web server** (build the frontend once, then run the backend):

```
npm run start
```

Then open http://localhost:4173.

**For frontend development** (hot reload against a running backend):

```
npm run dev:backend    # terminal 1 — http://localhost:4173
npm run dev:frontend   # terminal 2 — http://localhost:5173, proxies /api to the backend
```

**In Docker** (dashboard only — a container can't put an icon in your host's
menu bar):

```
docker compose up -d --build
```

Then open http://localhost:4173. Connected accounts persist in a named Docker
volume (`claude-usage-data`); `docker compose down -v` wipes it (and every
stored session key) along with the containers.

## What's shown per account

- Current 5-hour session usage and reset time
- Weekly usage across all models, plus per-model (Opus/Sonnet) weekly usage
  when the API returns it
- Extra usage spend vs. budget, when applicable
- Plan/org badge and last-updated time

## Notes on dependency versions

This machine runs Node 20.15.1. A couple of dependencies are pinned slightly
behind their latest majors because their *newest* versions require Node
≥20.19 or ≥22 to even install/build, not because of any feature gap:

- **Electron 37.x**, not 44.x — 44's installer needs Node ≥22.
  `npm audit` will flag advisories only fixed in 44+; none are reachable
  here (the app only loads its own localhost pages, `contextIsolation` is
  on, no offscreen rendering/webviews/custom protocol handlers).
- **Vite 6.x**, not 8.x — Vite 8 switched to the Rolldown bundler, which
  needs Node ≥20.19 and ships platform-specific native binaries that this
  npm/Node combination failed to install (a known npm optional-dependency
  bug). Vite 6 has no such requirement.

Upgrading Node to 22+ later and bumping both removes this constraint.

The tray icon itself is generated by `scripts/generate-tray-icon.mjs` into
`assets/` (a hand-encoded PNG, no image library needed) — rerun it for a
different glyph.

## Not in this MVP

- Per-prompt / per-token logs (no official source gives that granularity for
  subscription accounts — see `DISCUSSION.md`)
- ChatGPT, Gemini, or local-model providers (the menu already lists them as
  "Coming soon"; implementing one means adding `backend/features/<provider>/`
  with a `listWorkspaces`/`getUsage` adapter and a matching frontend connect
  step)
- Windows tray packaging (the Electron/menubar setup should work as-is on
  Windows, but it's only been run on macOS so far)
