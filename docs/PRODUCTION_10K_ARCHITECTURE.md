# TWIN: Production Architecture Blueprint for 10,000+ Independent User Accounts

> **Phase Status — Preparation Only (Demo Mode Active)**
> TWIN currently runs in local **Demo Mode** (`DEMO_MODE_ONLY_LOCK = true` in `src/lib/supabase.ts`). No live Supabase Auth provider or PostgreSQL instance is connected in this phase. Consequently, server-side authentication, database Row Level Security (RLS), concurrent multi-tenant isolation, and 10,000-user query throughput **have not been verified in production** and must be validated in staging before launch.

---

## 1. Service Boundary Architecture (Mock-to-Production Swap Design)

All UI components interact with user sessions, profiles, questionnaire responses, bookmarks, feedback, and matching through provider-agnostic interfaces in `src/services/contracts.ts`:

| Boundary Contract | Demo Mode Adapter (Active Now) | Production Target (Phase 2) |
| :--- | :--- | :--- |
| `IAuthService` (`src/services/authService.ts`) | `DemoAuthService` — deterministic `demo_usr_*` / `usr_me` IDs, masked phones, isolated demo session pointer | `SupabaseAuthService` — `supabase.auth` (Email+PKCE, Google OAuth, Phone OTP, JWT refresh) |
| `IProfileRepository` (`src/services/profileService.ts`) | `DemoProfileRepository` — `twin:v2:demo:user:<userId>:*` envelopes with strict `userId` + `accountMode` verification | `SupabaseProfileRepository` — PostgreSQL tables (`profiles`, `privacy_settings`, `user_question_answers`, `saved_profiles`, `site_feedback`) |
| `IMatchingRepository` (`src/services/matchingService.ts`) | `DemoMatchingRepository` — deterministic scoring over `MOCK_MATCHES` with self-match & mode guards | `SupabaseMatchingRepository` — PostgreSQL indexed candidate pre-filtering + `get_top_twin_matches_v2` / `query_discoverable_candidates` RPCs |

### Strict Separation of Demo vs Real Accounts
1. **Account Mode Discriminator**: Every identity, profile, match candidate, and storage envelope carries `accountMode: 'demo' | 'authenticated'` and `isDemo: boolean`.
2. **Storage Key Namespacing**:
   - Demo accounts use `twin:v2:demo:user:<userId>:<resource>`.
   - Authenticated UI caches (if any) use `twin:v2:auth:user:<authUid>:<resource>`, while Supabase Auth tokens use `twin:v2:auth:supabase_session`.
3. **Candidate Pool Quarantine**: `MOCK_MATCHES` (`twin_1_faisal` … `twin_6_reem`) are tagged `isDemo: true, accountMode: 'demo'` and are excluded whenever `accountMode === 'authenticated'`. Demo personas must **never** be seeded into production `public.profiles` without an explicit `is_demo_seed` exclusion or separate staging project.

---

## 2. Relational Data Model & Query Design for 10,000+ Accounts

Supporting 10,000+ independent accounts reliably is **not** guaranteed by PostgreSQL table capacity alone; naive $O(N)$ full-table JSONB scans or unpaginated client fetches degrade rapidly under concurrent load. For example, 10,000 users $\times$ 15 questions = **150,000 answer rows**, and all-pairs comparisons equal $\approx 50,000,000$ undirected pairs.

### 2.1. Core Relational Ownership Hierarchy (`auth.users.id` Root)
Every user-owned row in PostgreSQL references `auth.users(id) ON DELETE CASCADE` (either directly or transitively via `public.profiles(id)`):

1. `public.profiles` (`id UUID PK REFERENCES auth.users(id) ON DELETE CASCADE`)
   - `username CITEXT UNIQUE NOT NULL` (`^[a-z0-9_]{3,20}$`)
   - `city_id TEXT NOT NULL REFERENCES public.cities(id)`
   - `gender TEXT`, `age_range TEXT`, `bio TEXT`, `avatar JSONB NOT NULL`
   - `is_completed BOOLEAN NOT NULL DEFAULT false`
   - `answered_count SMALLINT NOT NULL DEFAULT 0`
   - `answer_Tokens TEXT[] NOT NULL DEFAULT '{}'` *(denormalized `question_id:option_id` array maintained by trigger for fast GIN overlap pre-filtering)*
2. `public.private_user_data` (`user_id UUID PK REFERENCES auth.users(id) ON DELETE CASCADE`)
   - Quarantines `phone_masked`, `phone_verified_at`, `marketing_opt_in`, and audit timestamps away from public SELECT policies.
3. `public.privacy_settings` (`user_id UUID PK REFERENCES public.profiles(id) ON DELETE CASCADE`)
   - `show_city_publicly`, `show_gender_publicly`, `show_age_range_publicly`, `allow_discoverability`.
4. `public.user_question_answers` (`PRIMARY KEY (user_id, question_id)`)
   - Normalized storage for all 15 questionnaire dimensions (`selected_options TEXT[] NOT NULL`, `question_version TEXT NOT NULL`).
   - Eliminates rigid per-category table sprawl while preserving strict foreign-key ownership (`user_id REFERENCES public.profiles(id) ON DELETE CASCADE`).
5. `public.saved_profiles` (`PRIMARY KEY (user_id, saved_profile_id)`, `CHECK (user_id <> saved_profile_id)`)
   - Replaces client-only bookmark arrays with indexed, user-isolated relational rows.
6. `public.blocked_users` (`PRIMARY KEY (user_id, blocked_user_id)`, `CHECK (user_id <> blocked_user_id)`)
   - Enforces mutual invisibility across discovery, profile reads, and matching RPCs.
7. `public.daily_vibe_responses` (`PRIMARY KEY (user_id, response_date, question_id)`)
   - Per-user daily vibe vote history and streak derivation; aggregated community percentages are served via anonymized materialized counters (`public.daily_vibe_aggregates`).
8. `public.site_feedback` (`id UUID PK`, `user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE`)
   - User-owned feature suggestions with private read/insert RLS.
9. `public.match_scores_cache` (`PRIMARY KEY (user_id, matched_user_id)`, `CHECK (user_id <> matched_user_id)`)
   - Optional precomputed top-K match cache invalidated via `answers_updated_at` watermark.

### 2.2. Required Indexes & Query Discipline for 10,000+ Scale
To avoid sequential scans across 10k–100k+ accounts:
- **Partial Discovery Index**:
  `CREATE INDEX idx_profiles_discoverable_city_cursor ON public.profiles (city_id, updated_at DESC, id ASC) WHERE is_completed = true;`
- **GIN Token Overlap Index (Candidate Bounding)**:
  `CREATE INDEX idx_profiles_answer_tokens_gin ON public.profiles USING GIN (answer_tokens) WHERE is_completed = true;`
  - Instead of scoring all $N$ users in PL/pgSQL on every request, the matching RPC first retrieves a bounded candidate set (e.g., top 500–1,000 candidates sharing $\ge 1$ `answer_tokens` via `p.answer_tokens && caller_tokens`, prioritizing same `city_id` when requested, excluding `blocked_users` and `id = auth.uid()`), and computes exact weighted similarity on that bounded set.
- **Keyset (Cursor) Pagination**:
  - Discovery endpoints (`DiscoverScreen`, `NearbyMembersModal`) must use keyset pagination `(similarity_score DESC, id ASC)` or `(updated_at DESC, id ASC)` with `LIMIT 20`–`50`, **never** `SELECT * FROM profiles` or large `OFFSET` scans.
- **Connection Pooling**:
  - Route client PostgREST traffic through Supabase Supavisor transaction-mode pooling (`port 6543` for serverless functions) and enforce statement timeouts (`statement_timeout = '5s'`).

---

## 3. Production Authentication & Account Lifecycle Requirements

### 3.1. Email Verification
- **Requirement**: Users signing up with email + password (`supabase.auth.signUp`) must verify email ownership before their profile can become discoverable (`is_completed` / `allow_discoverability` gated on `auth.jwt() ->> 'email_confirmed_at' IS NOT NULL` or verified phone/OAuth provider).
- **Flow**:
  1. Enable **Confirm email** in Supabase Auth settings using **PKCE** flow (`flowType: 'pkce'`) or 6-digit email OTP.
  2. Configure custom SMTP provider (Resend / Postmark / AWS SES) with SPF, DKIM, and DMARC—do not use Supabase's built-in 2-4 emails/hr development SMTP in production.
  3. Set OTP/link expiration to `3600s` (1 hour) and enforce resend cooldown (`>= 60s` client + edge rate limit).
  4. Until verified, hold the user on a dedicated verification screen with "Resend code" and "Change email" actions; block writes to public discovery tables via RLS or trigger check.

### 3.2. Password Recovery
- **Requirement**: Self-service password reset without account enumeration leaks.
- **Flow**:
  1. Invoke `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${APP_URL}/auth/reset-password` })` protected by Cloudflare Turnstile / CAPTCHA.
  2. Always display a generic confirmation message (*"If an account exists for this email, a reset link has been sent"*) so attackers cannot enumerate registered emails.
  3. Handle the `PASSWORD_RECOVERY` event in `onAuthStateChange`, render a dedicated password-update form enforcing minimum 10+ characters and breached-password checks (HaveIBeenPwned integration in Supabase Auth), and call `supabase.auth.updateUser({ password })`.
  4. Revoke all other refresh tokens (`supabase.auth.signOut({ scope: 'others' })`) immediately after password change.

### 3.3. Google Sign-In (OAuth 2.0 + OIDC PKCE)
- **Requirement**: Frictionless 1-tap / redirect sign-in via Google with automatic first-time handle setup.
- **Configuration**:
  1. Create a Google Cloud OAuth 2.0 Web Client; configure authorized redirect URI to `https://<project-ref>.supabase.co/auth/v1/callback` and add production `APP_URL` to Supabase **Redirect URLs** allowlist.
  2. Call `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: APP_URL, queryParams: { prompt: 'select_account' } } })`.
  3. **First-Login Profile Bootstrap**: Do **not** auto-expose the user's real email prefix or Google full name as their public `@username` without confirmation. On session callback, check if `public.profiles` has a row for `auth.uid()`; if absent, route to the TWIN Identity step (`username` + `city`) before onboarding.
  4. Review Supabase **Automatic Identity Linking** behavior carefully: only link Google and Email identities when `email_verified = true` on both providers.

### 3.4. Session Management
- **Token Lifecycle**:
  - Short-lived JWT access tokens (`900s`–`3600s` expiry) paired with rotating single-use refresh tokens (reuse interval `10s`, automatic token family revocation on replay detection).
- **Client Synchronization**:
  - Subscribe once at the app root via `IAuthService.onAuthStateChange` to handle `INITIAL_SESSION`, `SIGNED_IN`, `TOKEN_REFRESHED`, `USER_UPDATED`, and `SIGNED_OUT` across browser tabs.
  - On `SIGNED_OUT` or user ID mismatch (`nextSession.user.id !== currentProfile.id`), immediately clear React in-memory state (`userProfile`, `savedProfileIds`, `calculatedMatches`, modals) and purge cached user storage keys before rendering the signed-out screen.

### 3.5. Database Migrations
- **Workflow**:
  1. Store all DDL, indexes, triggers, views, and RLS policies as immutable timestamped SQL files in `supabase/migrations/`.
  2. Never edit production tables manually in the Supabase Table Editor.
  3. Test every migration from scratch (`supabase db reset`) and against a staging clone populated with $\ge 10,000$ synthetic user rows (`EXPLAIN (ANALYZE, BUFFERS)` on matching & discovery queries).
  4. For live tables with $> 10,000$ rows, add new indexes using `CREATE INDEX CONCURRENTLY` and apply multi-step expand/contract migrations when renaming columns or constraints.

### 3.6. Row Level Security (RLS)
- Enable `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and `FORCE ROW LEVEL SECURITY` on **every** table in `public`.
- Revoke default privileges from `anon` role on all user tables; require `TO authenticated` on policies.
- Enforce `auth.uid() = id` / `auth.uid() = user_id` on all `INSERT`, `UPDATE`, and `DELETE` policies.
- Never expose `public.profiles` directly with hidden privacy columns intact if column-level privacy (`show_city_publicly`, `show_gender_publicly`, `show_age_range_publicly`) applies—expose a privacy-redacting view or `SECURITY DEFINER` RPC (`search_path = public, pg_temp`) that masks `city_id`, `gender`, and `age_range` when the target user's `privacy_settings` flags are `false`.

### 3.7. Account Deletion (GDPR / Saudi PDPL Compliance)
- **Requirement**: Users must be able to permanently delete their account and all associated personal data in-app.
- **Implementation**:
  1. Client cannot delete its own `auth.users` row using the public `anon` key. Deploy a verified Supabase Edge Function (`POST /functions/v1/delete-my-account`) that validates the caller's Bearer JWT (`supabaseClient.auth.getUser(jwt)`), optionally requires recent re-authentication (OTP / password / OAuth within 10 minutes), and executes `supabaseAdmin.auth.admin.deleteUser(user.id)` using the server-only `SUPABASE_SERVICE_ROLE_KEY`.
  2. PostgreSQL `ON DELETE CASCADE` atomically purges `profiles`, `private_user_data`, `privacy_settings`, `user_question_answers`, `saved_profiles`, `blocked_users`, `daily_vibe_responses`, `site_feedback`, and `match_scores_cache`.
  3. Client invokes `IProfileRepository.purgeUserData(userId)` and `IAuthService.signOut()` to erase all local browser storage artifacts.
