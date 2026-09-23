// The shape every provider client implements: listWorkspaces(sessionKey)
// and getUsage(sessionKey, workspaceId). The accounts/usage features only
// ever talk to this shape, never to claude.client.js directly.
import { listOrganizations, getUsage } from "./claude.client.js";

export const claudeProvider = {
  id: "claude",
  listWorkspaces: listOrganizations,
  getUsage,
};
