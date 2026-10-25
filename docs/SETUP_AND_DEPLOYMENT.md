# TWIN: Setup, Testing & Future Deployment Guide

## 1. Local Demo Development (Current Phase)

TWIN runs out-of-the-box in isolated **Demo Mode** (`DEMO_MODE_ONLY_LOCK = true` in `src/lib/supabase.ts`) with zero external database or secret requirements.

```bash
# Install dependencies
npm install

# Run TypeScript static analysis
npm run lint

# Run automated multi-user isolation, migration & matching test suite
npm test

# Start local Vite dev server on port 3000
npm run dev

# Build production bundle
npm run build
```

---

## 2. Future Production Activation Sequence (Phase 2)

Do **not** flip `DEMO_MODE_ONLY_LOCK` to `false` until all steps below are completed and verified in a staging environment:

1. **Provision Supabase Project & Auth Providers**:
   - Follow `docs/EXTERNAL_CONFIGURATION_STEPS.md` to configure Email verification (custom SMTP), Password recovery, Google OAuth, CAPTCHA protection, and Redirect URLs.
2. **Apply Database Migrations & RLS Policies**:
   ```bash
   supabase link --project-ref <your-staging-project-ref>
   supabase db push
   ```
   - Applies `supabase/migrations/20261024000000_twin_10k_schema_and_rls_blueprint.sql`.
3. **Deploy Account Deletion Edge Function**:
   - Deploy an authenticated Edge Function (`delete-my-account`) using server-only `SUPABASE_SERVICE_ROLE_KEY` to execute `supabaseAdmin.auth.admin.deleteUser(auth.uid())`.
4. **Implement Concrete Production Adapters Behind Existing Contracts**:
   - Wire `SupabaseAuthService`, `SupabaseProfileRepository`, and `SupabaseMatchingRepository` to `IAuthService`, `IProfileRepository`, and `IMatchingRepository` (`src/services/contracts.ts`).
5. **Load-Test & Verify RLS Isolation in Staging**:
   - Seed $\ge 10,000$ synthetic staging accounts, verify cross-account RLS denial tests (User A cannot read User B's `private_user_data`, `saved_profiles`, `site_feedback`, or non-discoverable profile), and verify query plans via `EXPLAIN (ANALYZE, BUFFERS)`.
