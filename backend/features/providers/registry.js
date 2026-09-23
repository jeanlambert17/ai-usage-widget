// The single list the "Connect account" menu and the usage dispatcher both
// read from. Adding a new provider later means adding an entry here plus a
// features/<provider>/ module that implements the provider client shape
// (listWorkspaces, getUsage) — nothing else in the app needs to change.
export const PROVIDERS = [
  { id: "claude", name: "Claude", vendor: "Anthropic", status: "available" },
  { id: "chatgpt", name: "ChatGPT", vendor: "OpenAI", status: "coming_soon" },
  { id: "gemini", name: "Gemini", vendor: "Google", status: "coming_soon" },
];

export function getProvider(id) {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}
