# OIDC Provider Setup

Lexio now supports `LOCAL`, `HYBRID`, and `OIDC_ONLY` auth modes.

## Required provider values

Set these values in your deployment environment to enable OIDC:

- `AUTH_MODE=OIDC_ONLY` or `AUTH_MODE=HYBRID`
- `OIDC_PROVIDER_LABEL`
- `OIDC_ISSUER_URL`
- `OIDC_CLIENT_ID`
- `OIDC_CLIENT_SECRET`
- `OIDC_REDIRECT_URI`
- `OIDC_SCOPE`

## Recommended hardening

- `OIDC_ALLOWED_DOMAINS`: comma-separated allowlist of accepted email domains.
- `AUTH_POST_LOGIN_URL`: app landing URL after successful SSO.
- `AUTH_POST_LOGOUT_URL`: app landing URL after logout.
- `AUTH_COOKIE_SECURE=true`
- `AUTH_COOKIE_SAME_SITE=none` when the SPA and API run on different origins under TLS.
- `AUTH_TRUST_PROXY=true` when deployed behind a reverse proxy or ingress.

## Password reset

Self-service password reset is available only when local auth is enabled.

- `AUTH_MODE=LOCAL` or `AUTH_MODE=HYBRID`
- `AUTH_PASSWORD_RESET_URL`: include `{token}` and optionally `{email}`
- `AUTH_PASSWORD_RESET_TTL_MINUTES`
- `AUTH_EMAIL_DELIVERY_MODE=file|log|resend|postmark|sendgrid|webhook`
- `AUTH_EMAIL_FROM`
- `AUTH_EMAIL_REPLY_TO`
- `AUTH_EMAIL_TIMEOUT_MS`

Provider-backed delivery options:

- `resend` / `postmark` / `sendgrid`:
  - `AUTH_EMAIL_API_URL` (optional override for the provider endpoint)
  - `AUTH_EMAIL_API_KEY`
- `webhook`:
  - `AUTH_EMAIL_WEBHOOK_URL`
  - `AUTH_EMAIL_WEBHOOK_SECRET` (optional bearer token)
- `file`:
  - `AUTH_EMAIL_OUTBOX_PATH`

## Case-level authorization

Lexio now combines role-based authorization with case assignments.

- Global role decides the type of action the user can ever perform.
- Case assignment decides where the user can perform it.

Assignment levels:

- `OWNER`: full access to the case
- `EDITOR`: can upload documents and manage parties
- `REVIEWER`: can add/edit notes and activity, but not upload batches
- `VIEWER`: read-only access

`PLATFORM_ADMIN` bypasses case assignment checks. Other roles require an explicit assignment to open or modify a matter.

## Current provider integration model

The current implementation assumes a standards-compliant OIDC provider with:

- discovery at `/.well-known/openid-configuration`
- `authorization_endpoint`
- `token_endpoint`
- `userinfo_endpoint`
- optional `end_session_endpoint`

User provisioning uses:

- `sub` as the stable external subject when available
- `email` as the required login identity
- `name` or `preferred_username` as the display name fallback

## What I still need from a real firm IdP

To wire a concrete provider directly, the remaining inputs are operational, not code-level:

- issuer URL
- client ID
- client secret
- redirect URI registered in the provider
- any email-domain restrictions
- whether the provider requires provider-specific logout parameters beyond standard OIDC

Once those values exist, the platform can run in `OIDC_ONLY` mode without additional auth model changes.
