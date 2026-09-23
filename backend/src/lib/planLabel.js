// Providers' raw account/org fields tend to hold internal engineering values
// (billing mechanisms, rate-limit-config codenames) rather than the
// customer-facing plan name — there's no reliable way to derive "Pro" /
// "Max" / "Team" from arbitrary internal strings. Only recognize known plan
// keywords; anything else returns null (no badge) rather than showing raw
// internal noise. Used both when a provider first detects a plan, and
// defensively whenever an account is read back, so a stale bad value stored
// before this filter existed doesn't linger just because it was never
// re-detected.
export function friendlyPlanLabel(raw) {
  if (!raw) return null;
  const value = String(raw).toLowerCase();
  const maxMultiplier = value.match(/max[_-]?(\d+)x/);
  if (maxMultiplier) return `Max ${maxMultiplier[1]}x`;
  if (value.includes("enterprise")) return "Enterprise";
  if (value.includes("team")) return "Team";
  if (value.includes("max")) return "Max";
  if (value.includes("pro")) return "Pro";
  if (value.includes("free")) return "Free";
  return null;
}
