export function extractCookie(
  cookieHeader: string | undefined,
  key: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(';');
  for (const cookie of cookies) {
    const [cookieKey, ...rest] = cookie.trim().split('=');
    if (cookieKey === key) {
      return rest.join('=') || null;
    }
  }

  return null;
}

export function extractSessionToken(
  cookieHeader: string | undefined,
  cookieName: string,
): string | null {
  return extractCookie(cookieHeader, cookieName);
}
