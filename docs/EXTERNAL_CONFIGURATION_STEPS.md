# TWIN: External Provider & Dashboard Configuration Steps (Production Launch Checklist)

> **Preparation Only**: Do **not** commit live keys or enable production providers inside the repository during the Demo Mode phase. Configure the steps below in your external Supabase and Google Cloud projects prior to flipping `DEMO_MODE_ONLY_LOCK = false`.

## 1. Email Authentication, Verification & Recovery

1. In Supabase Dashboard -> **Authentication** -> **Providers** -> **Email**:
   - Enable **Email Provider** and **Confirm email**.
   - Enable **Secure password change** and **Prevent use of leaked passwords** (HaveIBeenPwned check).
2. In **Authentication** -> **SMTP Settings**:
   - Configure a dedicated transactional SMTP provider (Resend, Postmark, or AWS SES) with verified `SPF`, `DKIM`, and `DMARC` DNS records.
3. In **Authentication** -> **Email Templates**:
   - Configure bilingual (Arabic/English) templates for **Confirm signup** and **Reset password** pointing to `${SITE_URL}/auth/callback` (PKCE).

## 2. Google OAuth Sign-In Setup

1. In Google Cloud Console -> **APIs & Services** -> **Credentials**:
   - Configure the OAuth Consent Screen (`External`, scopes: `openid`, `email`, `profile`).
   - Create an **OAuth 2.0 Web Application Client ID**.
   - Add Authorized JavaScript Origin: `https://<your-production-domain>`
   - Add Authorized Redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
2. In Supabase Dashboard -> **Authentication** -> **Providers** -> **Google**:
   - Paste the Client ID and Client Secret (stored exclusively in Supabase Dashboard, **never** in client env vars).

## 3. Phone Authentication & Anti-Abuse Controls (Optional SMS OTP)

1. In **Authentication** -> **Providers** -> **Phone**, configure Twilio / MessageBird / Vonage with OTP expiry `300s`.
2. Enable **Attack Protection (CAPTCHA)** using Cloudflare Turnstile or hCaptcha in **Authentication** -> **Attack Protection** to prevent SMS pumping and credential-stuffing attacks.

## 4. Session Management & Redirect Allowlist

1. In **Authentication** -> **Sessions**:
   - Set **JWT Expiry** to `900`–`3600` seconds.
   - Enable **Detect and revoke potentially compromised refresh tokens** (`10s` reuse interval).
2. In **Authentication** -> **URL Configuration**:
   - Set **Site URL** to your production HTTPS origin and explicitly list allowed callback paths (`/auth/callback`, `/auth/reset-password`).
