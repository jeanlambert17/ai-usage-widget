import { Router } from "express";
import { connectAccount, listAccounts, removeAccount, editAccountPlan } from "./accounts.service.js";

export const accountsRouter = Router();

accountsRouter.get("/", async (req, res, next) => {
  try {
    res.json(await listAccounts());
  } catch (err) {
    next(err);
  }
});

accountsRouter.post("/", async (req, res, next) => {
  try {
    const { providerId, label, sessionKey } = req.body ?? {};
    const created = await connectAccount({
      providerId: providerId || "claude",
      label,
      sessionKey,
    });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

accountsRouter.patch("/:id", async (req, res, next) => {
  try {
    const { plan } = req.body ?? {};
    const updated = await editAccountPlan(req.params.id, plan);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

accountsRouter.delete("/:id", async (req, res, next) => {
  try {
    const removed = await removeAccount(req.params.id);
    res.status(removed ? 200 : 404).json({ removed });
  } catch (err) {
    next(err);
  }
});
