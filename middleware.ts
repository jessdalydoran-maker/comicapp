import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { CREATOR_AUTH_COOKIE, isCreatorAuthenticated } from "@/lib/auth";

export function middleware(request: NextRequest) {
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
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/create", "/create/:path*", "/preview", "/preview/:path*"],
};
