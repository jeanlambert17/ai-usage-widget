import { Router } from "express";
import { PROVIDERS } from "./registry.js";

export const providersRouter = Router();

providersRouter.get("/", (req, res) => {
  res.json(PROVIDERS);
});
