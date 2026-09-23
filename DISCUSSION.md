# AI Usage Snippet — Conversation Resume

_Last updated: 2026-09-21 · Status: exploratory. Nothing below is settled
except where explicitly marked._

## The idea

A lightweight tool that tracks AI usage — plan quota and/or token consumption —
across the AI services you use, with per-prompt granularity where possible
(`prompt1 → 15k tokens`, `prompt2 → 20k tokens`, …). The per-prompt log is
valuable even when you don't care about quota, as a record of what you spent
where.

**Platforms:** macOS + Windows first, future-proofed for iOS and Android.
Surface should be platform-native — tray/menu-bar icon on desktop revealing
detail on click; widgets on mobile later. Shared logic, and ideally shared UI,
in a single codebase.

**Provider scope:** the big platforms first (Claude, ChatGPT, Gemini), then
custom/local models such as Ollama.

**Hard constraint:** minimum possible permissions. This penalises anything
needing browser extensions, stored session cookies, accessibility APIs, or
screen scraping.

**Framework question raised, not answered:** Electron or Tauri, or something
else given the mobile ambition.

## Settled

**This effort produces a spec, not a build.** Architecture decisions get
written down first; converting them into implementation tickets is a separate
pass afterwards. Rationale: too many open forks to start building.

That is the only decision taken so far.

## Findings — what the providers actually expose

These are facts established by research during the conversation, independent of
any decision.

### Anthropic / Claude

Two distinct things share the name "Claude usage," and only one is a public API.

**Admin / Usage API — exists, but narrow.**
`/v1/organizations/usage_report/messages` and `/v1/organizations/cost_report`
return token usage and USD cost bucketed over time, groupable by API key,
workspace, model, or service tier. Data appears within ~5 minutes.
Constraints: requires an **Admin API key** (`sk-ant-admin…`, distinct from a
normal key); **not available to individual accounts**; reports **developer-API
billing usage**, not Claude.ai subscription usage.
[Usage and Cost API](https://platform.claude.com/docs/en/manage-claude/usage-cost-api)
· [Messages Usage Report](https://platform.claude.com/docs/en/api/beta/organization/usage_report/retrieve_messages)

**Claude.ai Pro/Max subscription quota — no public API.**
The 5-hour rolling window and weekly limits (Settings → Usage, or `/usage` in
Claude Code) come from an internal endpoint only official clients call. An open
feature request asks Anthropic to expose it; it does not exist yet.
[anthropics/claude-code#44328](https://github.com/anthropics/claude-code/issues/44328)

**What a normal API key can see:** `anthropic-ratelimit-*` response headers —
per-minute throughput limits, not cumulative usage.

### OpenAI

`/v1/organization/usage/completions` plus a cost API. Admin key required,
org-scoped. Time buckets down to **1 minute**, groupable by project, user, API
key, model, batch, or service tier. The richest of the three.
[Usage API](https://platform.openai.com/docs/api-reference/usage/completions)

### Google / Gemini

No usage REST endpoint. Programmatic access goes through **Cloud Monitoring**
metrics (`generativeai.googleapis.com/request_count`) and Cloud Billing, with
GCP service-account auth — a structurally different integration from the other
two. AI Studio offers a dashboard, not an API.
[Gemini billing](https://ai.google.dev/gemini-api/docs/billing)

### Two consequences worth carrying forward

1. **Official APIs are all org/admin-scoped.** They do not reach a Claude
   Pro/Max subscriber, nor a solo developer holding a personal API key.
2. **Official APIs are time-bucketed aggregates, not per-request events.** The
   finest resolution available anywhere is OpenAI's 1-minute bucket. The
   literal `prompt1 → 15k tokens` log from the original brief is not obtainable
   from official sources.

## Open questions

### 1. Where does usage data come from?

Stated lean: **official APIs, ideally.** Given the findings above, that lean
has costs that have not yet been weighed. Candidates discussed:

| Mechanism | Covers | Permission cost | Notes |
|---|---|---|---|
| Official usage APIs | Org-level API spend | Low (admin key) | Misses subscribers and solo devs |
| Local proxy on localhost | Any provider incl. Ollama | None | True per-prompt data; misses web/desktop chat apps |
| Local CLI & agent logs | Claude Code, Ollama, CLI agents | Low | Real per-prompt data; terminal-only |
| Manual / self-reported | Anything | None | Needs something to measure |
| Browser scraping / session cookies | Consumer plans | **High** | Only route to subscription quota; fragile, ToS-risky, conflicts with the permissions constraint |

### 2. What happens to the per-prompt log?

Unresolved. Options surfaced: normalise everything to time-bucketed usage
records and treat per-prompt as a degenerate case; drop per-prompt and build a
spend dashboard; keep per-prompt as an OpenAI-only feature; or reopen a local
proxy specifically to get true per-request granularity.

### 3. Whose usage is this tool for?

Implicit in question 1 but not yet asked directly — an org admin, a solo
developer with a personal key, and a Pro/Max subscriber have almost nothing in
common in terms of what data is reachable.

## Not yet discussed

- Tauri vs Electron, and whether either suits the mobile ambition
- Local data model and storage for whatever the usage record turns out to be
- Tray-vs-widget behaviour; how much UI genuinely shares across desktop and mobile
- Whether custom/local models (Ollama et al.) are MVP or follow-on
- Polling cadence, credential storage, offline behaviour
