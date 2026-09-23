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

function detectPlan(org) {
  // The org payload's shape for plan/tier info isn't documented and has
  // shifted across claude.ai releases, so probe a few plausible fields
  // instead of hard-failing when one is missing.
  const candidates = [
    org.billing_type,
    org.rate_limit_tier,
    org.plan,
    org.subscription_type,
  ].filter(Boolean);
  if (candidates.length === 0) return null;
  return String(candidates[0]).replace(/_/g, " ");
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
