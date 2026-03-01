import { registerAs } from '@nestjs/config';

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function parseCsv(value: string | undefined): string[] {
  return (value || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseTrustProxy(value: string | undefined): boolean | number {
  if (!value) {
    return false;
  }

  if (['1', 'true', 'yes', 'on'].includes(value.toLowerCase())) {
    return true;
  }

  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber;
  }

  return false;
}

export const authConfig = registerAs('auth', () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const secureCookies = parseBoolean(process.env.AUTH_COOKIE_SECURE, isProduction);
  const appUrl = process.env.AUTH_APP_URL || 'http://localhost:4200';
  const postLoginUrl = process.env.AUTH_POST_LOGIN_URL || `${appUrl.replace(/\/$/, '')}/`;
  const postLogoutUrl =
    process.env.AUTH_POST_LOGOUT_URL ||
    process.env.AUTH_POST_LOGIN_URL ||
    `${appUrl.replace(/\/$/, '')}/`;
  const sameSite = (process.env.AUTH_COOKIE_SAME_SITE || (secureCookies ? 'none' : 'lax')).toLowerCase();
  const allowedOrigins = parseCsv(process.env.CORS_ALLOWED_ORIGINS);

  return {
    mode: (process.env.AUTH_MODE || 'LOCAL').toUpperCase(),
    providerLabel: process.env.OIDC_PROVIDER_LABEL || 'SSO del despacho',
    appUrl,
    postLoginUrl,
    postLogoutUrl,
    sessionCookieName: process.env.AUTH_SESSION_COOKIE_NAME || 'lexio_session',
    oidcStateCookieName: process.env.AUTH_OIDC_STATE_COOKIE_NAME || 'lexio_oidc_state',
    cookieDomain: process.env.AUTH_COOKIE_DOMAIN || undefined,
    cookiePath: process.env.AUTH_COOKIE_PATH || '/',
    cookieSecure: secureCookies,
    cookieSameSite:
      sameSite === 'strict' || sameSite === 'none' ? sameSite : 'lax',
    trustProxy: parseTrustProxy(process.env.AUTH_TRUST_PROXY),
    sessionTtlHours: Number(process.env.AUTH_SESSION_TTL_HOURS || 24 * 7),
    passwordResetTokenTtlMinutes: Number(
      process.env.AUTH_PASSWORD_RESET_TTL_MINUTES || 30,
    ),
    passwordResetUrlTemplate:
      process.env.AUTH_PASSWORD_RESET_URL ||
      `${appUrl.replace(/\/$/, '')}/?resetToken={token}`,
    emailDeliveryMode: (process.env.AUTH_EMAIL_DELIVERY_MODE || 'file').toLowerCase(),
    emailOutboxPath:
      process.env.AUTH_EMAIL_OUTBOX_PATH || './var/mail-outbox',
    emailFrom: process.env.AUTH_EMAIL_FROM || 'no-reply@lexio.local',
    emailReplyTo: process.env.AUTH_EMAIL_REPLY_TO || undefined,
    emailApiUrl: process.env.AUTH_EMAIL_API_URL || '',
    emailApiKey: process.env.AUTH_EMAIL_API_KEY || '',
    emailWebhookUrl: process.env.AUTH_EMAIL_WEBHOOK_URL || '',
    emailWebhookSecret: process.env.AUTH_EMAIL_WEBHOOK_SECRET || '',
    emailTimeoutMs: Number(process.env.AUTH_EMAIL_TIMEOUT_MS || 8000),
    corsAllowedOrigins:
      allowedOrigins.length > 0
        ? allowedOrigins
        : [
            'http://localhost:4000',
            'http://127.0.0.1:4000',
            'http://localhost:4200',
            'http://127.0.0.1:4200',
          ],
    oidcIssuerUrl: process.env.OIDC_ISSUER_URL || '',
    oidcClientId: process.env.OIDC_CLIENT_ID || '',
    oidcClientSecret: process.env.OIDC_CLIENT_SECRET || '',
    oidcRedirectUri: process.env.OIDC_REDIRECT_URI || '',
    oidcScope: process.env.OIDC_SCOPE || 'openid profile email',
    oidcAllowedDomains: parseCsv(process.env.OIDC_ALLOWED_DOMAINS).map((entry) =>
      entry.toLowerCase(),
    ),
  };
});
