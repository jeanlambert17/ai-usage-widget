// Thin client around claude.ai's internal (undocumented) web endpoints.
// These are the same endpoints claude.ai's own front-end calls when you open
// Settings -> Usage; there is no public/official API for Pro/Max/Team
// subscription quota, so this speaks the session-cookie protocol directly.
//
// Auth: a `sessionKey` cookie value (starts with sk-ant-sid01-...). Either
// pasted in by hand, or captured automatically from a real claude.ai login
// completed in an embedded browser window (see the desktop app's login
// flow) — either way, it's equivalent to being logged in as that account.
import { ProviderAuthError } from "../../src/lib/errors.js";

const BASE_URL = "https://claude.ai";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept: "application/json",
};

export class ClaudeAuthError extends ProviderAuthError {
  constructor(message) {
    super(message);
    this.name = "ClaudeAuthError";
  }
}

async function claudeFetch(sessionKey, path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      ...BROWSER_HEADERS,
      Cookie: `sessionKey=${sessionKey}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    throw new ClaudeAuthError("Session key rejected (expired or invalid).");
  }
  if (!res.ok) {
    throw new Error(`claude.ai request failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// Returns the list of organizations (workspaces) this session belongs to.
export async function listOrganizations(sessionKey) {
  const orgs = await claudeFetch(sessionKey, "/api/organizations");
  return orgs.map((org) => ({
    id: org.uuid,
    name: org.name ?? "Personal",
    plan: detectPlan(org),
  }));
}

// claude.ai's org fields hold internal engineering values (billing
// mechanisms, rate-limit-config codenames like "default_raven") that have
// nothing to do with the customer-facing plan name — there's no reliable way
// to derive "Pro"/"Max"/"Team" from them. Only recognize known plan
// keywords; anything else returns null (no badge) rather than showing raw
// internal noise. Accounts can also have their plan set manually via
// PATCH /api/accounts/:id for exactly this reason.
function friendlyPlanLabel(raw) {
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

function detectPlan(org) {
  const candidates = [org.rate_limit_tier, org.plan, org.subscription_type].filter(Boolean);
  for (const candidate of candidates) {
    const label = friendlyPlanLabel(candidate);
    if (label) return label;
  }
  return null;
}

// Returns raw usage payload for one organization.
export async function getUsage(sessionKey, orgId) {
  const data = await claudeFetch(sessionKey, `/api/organizations/${orgId}/usage`);
  return normalizeUsage(data);
}

function pct(bucket) {
  if (!bucket) return null;
  const value = bucket.utilization_pct ?? bucket.utilization ?? null;
  return value === null ? null : Math.round(value * 100) / 100;
}

function resetAt(bucket) {
  if (!bucket) return null;
  return bucket.resets_at ?? bucket.reset_at ?? null;
}

function normalizeUsage(data) {
  const buckets = {
    fiveHour: { label: "Current session", ...bucketOf(data.five_hour) },
    sevenDay: { label: "All models", ...bucketOf(data.seven_day) },
    sevenDayOpus: { label: "Opus", ...bucketOf(data.seven_day_opus) },
    sevenDaySonnet: { label: "Sonnet", ...bucketOf(data.seven_day_sonnet) },
  };

  const extraUsage = data.extra_usage
    ? {
        currentSpend: data.extra_usage.current_spending ?? null,
        budget: data.extra_usage.budget_limit ?? null,
      }
    : null;

  return { buckets, extraUsage, fetchedAt: new Date().toISOString() };
}

function bucketOf(raw) {
  if (!raw) return { utilization: null, resetsAt: null, present: false };
  return { utilization: pct(raw), resetsAt: resetAt(raw), present: true };
}
