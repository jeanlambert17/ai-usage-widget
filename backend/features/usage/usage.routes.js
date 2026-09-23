import { Router } from "express";
import { listAccounts, getAccount, getProviderClient } from "../accounts/accounts.service.js";

export const usageRouter = Router();

usageRouter.get("/", async (req, res, next) => {
  try {
    const accounts = await listAccounts();
    const results = await Promise.all(accounts.map(fetchOne));
    res.json(results);
  } catch (err) {
    next(err);
  }
});

async function fetchOne(account) {
  const full = await getAccount(account.id);
  try {
    const client = getProviderClient(full.provider);
    const usage = await client.getUsage(full.sessionKey, full.workspaceId);
    return { id: account.id, ok: true, usage };
  } catch (err) {
    return {
      id: account.id,
      ok: false,
      error: err.message,
      authError: Boolean(err.isAuthError),
    };
  }
}
