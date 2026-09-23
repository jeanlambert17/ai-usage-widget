import express from "express";
import path from "node:path";
import { existsSync } from "node:fs";

import { FRONTEND_DIST } from "./config.js";
import { HttpError } from "./lib/errors.js";
import { providersRouter } from "../features/providers/providers.routes.js";
import { accountsRouter } from "../features/accounts/accounts.routes.js";
import { usageRouter } from "../features/usage/usage.routes.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.use("/api/providers", providersRouter);
  app.use("/api/accounts", accountsRouter);
  app.use("/api/usage", usageRouter);

  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
    next();
  });

  if (existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
    // SPA fallback so client-side routes (e.g. /tray) survive a refresh.
    app.get("*", (req, res) => res.sendFile(path.join(FRONTEND_DIST, "index.html")));
  }

  app.use((err, req, res, next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
    if (err.isAuthError) return res.status(401).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Internal error" });
  });

  return app;
}
