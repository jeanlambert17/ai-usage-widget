export function resetText(iso: string | null, kind: "session" | "weekly"): string {
  if (!iso) return kind === "session" ? "No active session window" : "—";
  const diffMs = new Date(iso).getTime() - Date.now();
  if (diffMs <= 0) return "Resets shortly";
  const totalMinutes = Math.round(diffMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `Resets in ${minutes} min`;
  return `Resets in ${hours} hr ${minutes} min`;
}

export function formatRelative(date: Date): string {
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  return `${diffHr}h ago`;
}
