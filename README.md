# AI Usage — multi-account, multi-provider usage dashboard

A dashboard that shows AI usage — session/weekly quota today.

## how Claude usage data is obtained

There is no official public API for a Claude subscriber's usage quota. The only place that data lives is an internal endpoint claude.ai's own web client calls:

```
GET https://claude.ai/api/organizations/{orgId}/usage
```

Authenticated with the `sessionKey` cookie from a logged-in browser session — equivalent to being logged in as that account.

**This is an unofficial, reverse-engineered endpoint** and can change or
break without notice.

## Architecture

An npm workspace with two packages plus a thin desktop shell:

```
backend/            Express API (@ai-usage-snippet/backend)
  src/                 globals: app assembly, server bootstrap, config, generic lib.
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

- The backend serves the frontend's built static files itself (`backend/src/app.js`),
so in both Docker and the plain web mode there's exactly one process and one
port. 
- Electron just adds a tray icon and window chrome around that same backend + frontend.

## Setup

This project needs **Node ≥22.12** (Electron 44's own requirement — see
below). An `.nvmrc` pins the exact version this was built against:

```
nvm install   # reads .nvmrc, installs it if you don't have it yet
nvm use
```

`npm install` also refuses to run on an older Node (`engine-strict=true` in
`.npmrc`), so this isn't just a suggestion — the guardrail is real. Docker is
unaffected: its own image pins `node:20-alpine` independently of whatever's
active on your host.

## Run it

```
git clone git@github.com:jeanlambert17/ai-usage-widget.git
cd ai-usage-widget
nvm use   # see "Node version" below
```

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

Then open [http://localhost:4173](http://localhost:4173).

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

## What's shown per account

- Current 5-hour session usage and reset time
- Weekly usage across all models, plus per-model (Opus/Sonnet) weekly usage
when the API returns it
- Extra usage spend vs. budget, when applicable

