export interface Account {
  id: string;
  provider: string;
  label: string;
  workspaceId: string;
  workspaceName: string | null;
  plan: string | null;
  addedAt: string;
}
