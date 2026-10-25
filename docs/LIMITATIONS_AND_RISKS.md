# TWIN: Known Limitations & Production Risk Analysis

## 1. Current Demo-Mode Boundaries (Unverified Until Production Phase)

- **Client-Only Storage in Demo Mode**: All demo accounts, profiles, answers, bookmarks, vibe votes, and feedback items currently reside in browser `localStorage` under `twin:v2:demo:*` keys (`DEMO_MODE_ONLY_LOCK = true` in `src/lib/supabase.ts`).
- **Not Yet Verified Against Live Infrastructure**:
  - Real cryptographic authentication (Email OTP/PKCE, Password Recovery, Google OAuth, SMS OTP) is **not active**.
  - PostgreSQL Row Level Security (RLS) policies in `supabase/migrations/20261024000000_twin_10k_schema_and_rls_blueprint.sql` have **not** been executed or penetration-tested against a live Supabase instance.
  - Real 10,000-user database concurrency, latency percentiles (`p95`/`p99`), and index selectivity have **not** been benchmarked on live infrastructure.

---

## 2. Scaling Risks for 10,000+ Accounts & Required Mitigations

### Risk A: Unbounded $O(N)$ Candidate Scoring
- **Problem**: Computing pairwise similarity across all 10,000+ completed profiles on every screen load ($10,000 \times 15 = 150,000$ answer rows per request) causes high CPU contention under concurrent traffic—table row count capacity alone never guarantees query speed.
- **Required Mitigation**:
  1. Use the `GIN` index on `public.profiles.answer_tokens` (`idx_profiles_answer_tokens_gin`) + partial regional index (`idx_profiles_completed_city_cursor`) to pre-filter a bounded candidate set (e.g., $\le 500$ overlapping candidates) before scoring.
  2. Cache top-K results in `public.match_scores_cache` keyed by `(user_id, answers_updated_at)` and refresh asynchronously when `user_question_answers` changes.

### Risk B: Offset Pagination & Full-List Fetching in Discovery
- **Problem**: Loading all discoverable profiles into React state works for 6 mock profiles in demo mode, but fails in memory and bandwidth at 10,000+ users.
- **Required Mitigation**: Enforce cursor/keyset pagination (`IMatchingRepository.queryDiscoverableCandidates` with `limit <= 50` and `cursor`) backed by `(city_id, updated_at DESC, id ASC)` indexes.

### Risk C: Column-Level Privacy Leakage
- **Problem**: PostgreSQL RLS filters **rows**, not **columns**. If `SELECT * FROM public.profiles` is allowed directly for discoverable users, a user with `show_city_publicly = false` or `show_gender_publicly = false` would still leak those fields in raw PostgREST responses even if hidden in the UI.
- **Required Mitigation**: Restrict raw table column reads or serve third-party profile reads exclusively through a privacy-masking SQL view / `SECURITY DEFINER` RPC that nulls `city_id`, `gender`, and `age_range` according to `public.privacy_settings`.

### Risk D: Auth & SMS / Email Abuse
- **Problem**: Automated bots targeting OTP, sign-up, or password-reset endpoints.
- **Required Mitigation**: Require CAPTCHA (Cloudflare Turnstile) on all unauthenticated auth endpoints, configure custom domain SMTP with rate limits, and restrict phone OTP country prefixes if SMS is enabled.
