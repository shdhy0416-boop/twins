# TWIN — Demo Admin Dashboard Architecture & Production Security Requirements

## 1. Current Scope (Demo Phase Only)

The TWIN Admin Dashboard (`src/components/admin/*` and `src/services/adminService.ts`) is a **development-only, read-only monitoring workspace** operating strictly over local demo data:

- **Application Mode**: `DEMO` (`DEMO_MODE_ONLY_LOCK = true` in `src/lib/supabase.ts`).
- **Live Backend Connection**: **Disconnected** (`supabase === null`, `isSupabaseConfigured() === false`).
- **Data Sources**:
  1. Local browser demo session accounts registered via `DemoAuthService` (`twin:v2:demo:*` scoped `localStorage` envelopes).
  2. Built-in static demo community candidates (`MOCK_MATCHES` in `src/data/mockMatches.ts`).
  3. Active 15-question schema (`ONBOARDING_QUESTIONS` in `src/data/questions.ts`).
  4. Deterministic similarity scoring engine (`calculatePairwiseSimilarity` and `CATEGORY_WEIGHTS` in `src/services/matchingService.ts`).
- **No Destructive Controls**: User deletion, account suspension, role mutation, and questionnaire editing are intentionally omitted in this phase.
- **Zero Secrets Exposure**: Passwords, OTP codes, session JWTs, raw phone numbers, and `service_role` keys are never stored, read, or displayed.

---

## 2. Isolated Demo-Admin Access Mechanism (Development Only)

- Ordinary user navigation (`UnifiedAppHeader` and `BottomTabBar`) remains completely untouched and separate from the administrative area.
- During local development and demo preview, the Admin Dashboard can be opened via:
  1. Navigating to `#admin` (or `#/admin`) in the URL hash.
  2. Clicking the isolated **Demo Admin (Dev Only)** development switcher located outside the ordinary user navigation bars (or pressing `Alt + Shift + A`).
- **CRITICAL SECURITY CAVEAT**: Client-side URL hashes, keyboard shortcuts, UI toggles, or client-side role flags provide **zero** real security because all client JavaScript bundles are inspectable by end users.

---

## 3. Mandatory Production Requirements Before Launch

Before enabling an administrative console in production with real user accounts, the following server-side controls **must** be implemented and penetration-tested:

1. **Server-Enforced Administrator Authentication & RBAC**:
   - Authenticate administrators via real identity providers (e.g., Supabase Auth / OIDC) with mandatory Multi-Factor Authentication (`aal2` assurance level).
   - Store admin role claims exclusively in server-controlled metadata (`auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`), never in user-editable `user_metadata` or `localStorage`.
   - Enforce authorization checks on every server/Edge Function endpoint before returning any administrative payload.

2. **Database Access Policies & Row-Level Security (RLS)**:
   - Keep `public.profiles`, `public.private_user_data`, `public.user_question_answers`, and `public.match_scores_cache` locked down under strict PostgreSQL RLS.
   - Serve administrative aggregates (completion rates, score histograms, paginated user directories) through dedicated `SECURITY DEFINER` PostgreSQL functions or an isolated backend admin API that explicitly verifies `aal2` + `app_metadata.role = 'admin'`.
   - Never expose `public.private_user_data` (raw phone numbers, email addresses) unless strictly required and authorized with column-level redaction.

3. **Zero Client-Side Secret Keys**:
   - Never place `SUPABASE_SERVICE_ROLE_KEY`, database connection strings, or admin API secrets in `VITE_*` variables or client bundles.

4. **Immutable Audit Logging**:
   - Record every administrative read, search, and future moderation action in an append-only `public.admin_audit_logs` table (`actor_id`, `action`, `target_user_id`, `ip_hash`, `created_at`).
