import { HttpError } from "../../src/lib/errors.js";
import { getProvider } from "../providers/registry.js";
import { claudeProvider } from "../claude/claude.provider.js";
import { addAccountsForSession, listAccounts, getAccount, removeAccount } from "./accounts.store.js";

// Every available provider's client, keyed by provider id. This is the one
// place that needs to change when a second provider goes from
// "coming_soon" to real.
const PROVIDER_CLIENTS = {
  claude: claudeProvider,
};

export function getProviderClient(providerId) {
  const client = PROVIDER_CLIENTS[providerId];
  if (!client) throw new HttpError(400, `Unsupported provider: ${providerId}`);
  return client;
}

export async function connectAccount({ providerId, label, sessionKey }) {
  const provider = getProvider(providerId);
  if (!provider || provider.status !== "available") {
    throw new HttpError(400, `Unknown or unavailable provider: ${providerId}`);
  }
  if (!sessionKey || !sessionKey.trim()) {
    throw new HttpError(400, "sessionKey is required");
  }

  const client = getProviderClient(providerId);
  const trimmedKey = sessionKey.trim();
  const workspaces = await client.listWorkspaces(trimmedKey);
  if (workspaces.length === 0) {
    throw new HttpError(400, "No workspaces found for this session key");
  }

  return addAccountsForSession({
    provider: providerId,
    label: (label && label.trim()) || provider.name,
    sessionKey: trimmedKey,
    workspaces,
  });
}

export { listAccounts, getAccount, removeAccount };
