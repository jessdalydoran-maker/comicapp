import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/create") || pathname.startsWith("/preview");

  if (!isProtected) {
    return NextResponse.next();
  }

  const auth = request.cookies.get("creator_auth")?.value;

  if (auth === "true") {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/create/:path*", "/preview/:path*"],
};
