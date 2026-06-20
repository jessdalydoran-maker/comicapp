import { getAuthCookieDomain } from "./site";

export const CREATOR_AUTH_COOKIE = "creator_auth";

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function stripOptionalQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function getCreatorPassword(): string | undefined {
  const raw = process.env.CREATOR_PASSWORD;
  if (raw == null || raw === "") {
    return undefined;
  }

  return stripOptionalQuotes(raw.trim());
}

export function verifyCreatorPassword(input: string): boolean {
  const expected = getCreatorPassword();
  if (!expected) {
    return false;
  }

  const normalizedInput = input.trim();
  return normalizedInput === expected;
}

export function isSecureDeployment(): boolean {
  return (
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  );
}

export function getAuthCookieOptions() {
  const domain = getAuthCookieDomain();

  return {
    httpOnly: true,
    secure: isSecureDeployment(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE,
    ...(domain ? { domain } : {}),
  };
}

export function isCreatorAuthenticated(cookieValue: string | undefined): boolean {
  return cookieValue === "true";
}
