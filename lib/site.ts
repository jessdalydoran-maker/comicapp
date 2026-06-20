export const PRODUCTION_SITE_URL = "https://www.comicforge.co.uk";

export const PRODUCTION_SITE_ORIGINS = [
  "https://www.comicforge.co.uk",
  "https://comicforge.co.uk",
] as const;

const LOCAL_DEV_ORIGIN = "http://localhost:3000";

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return LOCAL_DEV_ORIGIN;
}

export function getSiteOrigin(): string {
  return new URL(getSiteUrl()).origin;
}

export function getAllowedOrigins(): string[] {
  const origins = new Set<string>([
    ...PRODUCTION_SITE_ORIGINS,
    LOCAL_DEV_ORIGIN,
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      origins.add(new URL(siteUrl).origin);
    } catch {
      // Ignore invalid NEXT_PUBLIC_SITE_URL values.
    }
  }

  return Array.from(origins);
}

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) {
    return false;
  }

  return getAllowedOrigins().includes(origin);
}

export function getAuthCookieDomain(): string | undefined {
  const explicit = process.env.AUTH_COOKIE_DOMAIN?.trim();
  if (explicit) {
    return explicit || undefined;
  }

  try {
    const hostname = new URL(getSiteUrl()).hostname;

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return undefined;
    }

    if (
      hostname === "comicforge.co.uk" ||
      hostname.endsWith(".comicforge.co.uk")
    ) {
      return ".comicforge.co.uk";
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function getSafeRedirectPath(
  path: string | null | undefined,
  fallback = "/create"
): string {
  if (!path) {
    return fallback;
  }

  if (path.startsWith("/") && !path.startsWith("//")) {
    return path;
  }

  try {
    const url = new URL(path);
    if (isAllowedOrigin(url.origin)) {
      return `${url.pathname}${url.search}${url.hash}` || fallback;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export function getAbsoluteUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}

export function applyCorsHeaders(
  response: Response,
  origin: string | null
): Response {
  if (!origin || !isAllowedOrigin(origin)) {
    return response;
  }

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Vary", "Origin");

  return response;
}

export function createCorsPreflightResponse(origin: string | null): Response {
  const headers = new Headers();

  if (origin && isAllowedOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Accept"
    );
    headers.set("Access-Control-Max-Age", "86400");
    headers.set("Vary", "Origin");
  }

  return new Response(null, { status: 204, headers });
}
