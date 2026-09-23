import path from "node:path";
import { randomUUID } from "node:crypto";
import { createJsonFileStore } from "../../src/lib/jsonFileStore.js";
import { DATA_DIR } from "../../src/config.js";
import { friendlyPlanLabel } from "../../src/lib/planLabel.js";

const store = createJsonFileStore(path.join(DATA_DIR, "accounts.json"), []);

// Public shape (never includes the sessionKey). Re-validates a non-manual
// plan on every read, not just at connect time — otherwise a bad value
// stored before this filter existed (or before it was tightened) would
// linger forever, since nothing else ever re-detects it.
function toPublic(account) {
  const { sessionKey, ...rest } = account;
  if (!rest.planManual && rest.plan) {
    rest.plan = friendlyPlanLabel(rest.plan);
  }
  return rest;
}

export async function listAccounts() {
  const accounts = await store.read();
  return accounts.map(toPublic);
}

export async function getAccount(id) {
  const accounts = await store.read();
  return accounts.find((a) => a.id === id) ?? null;
}

// Adds one tracked entry per workspace found under this session. Re-adding
// the same provider+sessionKey+workspace updates the label instead of
// duplicating.
export async function addAccountsForSession({ provider, label, sessionKey, workspaces }) {
  const accounts = await store.read();
  const created = [];

  workspaces.forEach((workspace) => {
    const workspaceLabel = workspaces.length > 1 ? `${label} — ${workspace.name}` : label;
    const existing = accounts.find(
      (a) =>
        a.provider === provider &&
        a.sessionKey === sessionKey &&
        a.workspaceId === workspace.id
    );
    if (existing) {
      existing.label = workspaceLabel;
      existing.workspaceName = workspace.name;
      // Don't clobber a plan the user set by hand with a fresh auto-detected
      // (possibly null/wrong) guess on reconnect.
      if (!existing.planManual) {
        existing.plan = workspace.plan;
      }
      created.push(toPublic(existing));
      return;
    }
    const account = {
      id: randomUUID(),
      provider,
      label: workspaceLabel,
      sessionKey,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      plan: workspace.plan,
      addedAt: new Date().toISOString(),
    };
    accounts.push(account);
    created.push(toPublic(account));
  });

  await store.write(accounts);
  return created;
}

// Manual override for fields auto-detection can't reliably provide (plan
// name, currently). Marks plan as user-set so it survives future reconnects.
export async function updateAccount(id, { plan } = {}) {
  const accounts = await store.read();
  const account = accounts.find((a) => a.id === id);
  if (!account) return null;

  if (plan !== undefined) {
    const trimmed = typeof plan === "string" ? plan.trim() : null;
    account.plan = trimmed || null;
    account.planManual = Boolean(trimmed);
  }

  await store.write(accounts);
  return toPublic(account);
}

export async function removeAccount(id) {
  const accounts = await store.read();
  const next = accounts.filter((a) => a.id !== id);
  await store.write(next);
  return next.length !== accounts.length;
}
