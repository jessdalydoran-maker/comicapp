import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { CREATOR_AUTH_COOKIE, isCreatorAuthenticated } from "@/lib/auth";
import {
  createCorsPreflightResponse,
  getSafeRedirectPath,
  isAllowedOrigin,
} from "@/lib/site";

function handleCors(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/")) {
    return null;
  }

  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    const preflight = createCorsPreflightResponse(origin);
    return new NextResponse(null, {
      status: preflight.status,
      headers: preflight.headers,
    });
  }

  const response = NextResponse.next();

  if (origin && isAllowedOrigin(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

export function middleware(request: NextRequest) {
  const corsResponse = handleCors(request);
  if (corsResponse) {
    return corsResponse;
  }

  const { pathname } = request.nextUrl;

  const isProtected =
    pathname === "/create" ||
    pathname.startsWith("/create/") ||
    pathname === "/preview" ||
    pathname.startsWith("/preview/");

  if (!isProtected) {
    return NextResponse.next();
  }

  const auth = request.cookies.get(CREATOR_AUTH_COOKIE)?.value;

  if (isCreatorAuthenticated(auth)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", getSafeRedirectPath(pathname));
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/api/:path*",
    "/create",
    "/create/:path*",
    "/preview",
    "/preview/:path*",
  ],
};
