# TWIN: Row-Level Security (RLS) & Privacy Architecture

> **Status Note**: These RLS policies apply to the future production PostgreSQL deployment (`supabase/migrations/20261024000000_twin_10k_schema_and_rls_blueprint.sql`). While TWIN runs in local Demo Mode, browser `localStorage` enforces functional per-user namespacing for demo UX only—**not** cryptographic or multi-tenant security.

## 1. Zero-Trust Security Invariants

1. **Phone, Email & Auth Token Quarantine**: Mobile numbers, email addresses, and verification metadata stay inside `auth.users` and `public.private_user_data` (`user_id = auth.uid()`). They are never stored in `public.profiles`.
2. **Strict Ownership on All User-Owned Tables**: Every write (`INSERT`, `UPDATE`, `DELETE`) across `profiles`, `privacy_settings`, `user_question_answers`, `saved_profiles`, `blocked_users`, `daily_vibe_responses`, and `site_feedback` enforces `auth.uid() = user_id` (or `id`).
3. **Server-Authoritative Match Cache**: Clients have `SELECT`-only access to their own `match_scores_cache` rows and zero direct write privileges.
4. **Mutual Blocking Enforcement**: If User A blocks User B, neither user can read the other's `profiles` or `user_question_answers` rows, nor appear in each other's matching/discovery RPC results.
5. **No UI-Only Privacy**: Column masking for `show_city_publicly`, `show_gender_publicly`, and `show_age_range_publicly` must execute inside PostgreSQL views/RPCs before JSON serialization to the client.

---

## 2. Policy Summary by Table

| Table | `SELECT` Policy | `INSERT / UPDATE / DELETE` Policy |
| :--- | :--- | :--- |
| `public.cities` | Any `authenticated` user | Admin / migration only (blocked for clients) |
| `public.profiles` | `id = auth.uid()` OR (`is_completed = true` AND `allow_discoverability = true` AND not mutually blocked) | `id = auth.uid()` (`DELETE` via `auth.users` cascade) |
| `public.private_user_data` | `user_id = auth.uid()` only | `user_id = auth.uid()` only |
| `public.privacy_settings` | `user_id = auth.uid()` only | `user_id = auth.uid()` only |
| `public.user_question_answers` | `user_id = auth.uid()` OR owner profile is completed, discoverable, and unblocked | `user_id = auth.uid()` only |
| `public.saved_profiles` | `user_id = auth.uid()` only | `user_id = auth.uid()` AND `user_id <> saved_profile_id` |
| `public.blocked_users` | `user_id = auth.uid()` only | `user_id = auth.uid()` AND `user_id <> blocked_user_id` |
| `public.daily_vibe_responses` | `user_id = auth.uid()` only | `user_id = auth.uid()` only |
| `public.site_feedback` | `user_id = auth.uid()` only | `INSERT` with `user_id = auth.uid()`; no client `UPDATE`/`DELETE` |
| `public.match_scores_cache` | `user_id = auth.uid()` only | Blocked for clients (`SECURITY DEFINER` RPC only) |

---

## 3. Account Deletion & Atomic Cascade Purge

- Account deletion must be executed through an authenticated server-side Edge Function calling `supabaseAdmin.auth.admin.deleteUser(auth.uid())` after verifying the caller's JWT and recent authentication timestamp.
- Deleting the root `auth.users` record triggers immediate PostgreSQL `ON DELETE CASCADE` across all dependent tables (`profiles`, `private_user_data`, `privacy_settings`, `user_question_answers`, `saved_profiles`, `blocked_users`, `daily_vibe_responses`, `site_feedback`, and `match_scores_cache`), followed by client-side `purgeUserData(userId)` cleanup.
