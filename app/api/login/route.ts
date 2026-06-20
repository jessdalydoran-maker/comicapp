import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { CREATOR_AUTH_COOKIE, getAuthCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// TEMP: hardcoded while diagnosing Vercel env var issues — restore CREATOR_PASSWORD later.
const TEMP_CREATOR_PASSWORD = "ComicForge2025";

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/login",
    version: "hardcoded-v2",
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: unknown };
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (password !== TEMP_CREATOR_PASSWORD) {
      return NextResponse.json(
        { error: "Wrong password. This is a private creator studio." },
        { status: 401 }
      );
    }

    const cookieOptions = getAuthCookieOptions();
    const cookieStore = cookies();
    cookieStore.set(CREATOR_AUTH_COOKIE, "true", cookieOptions);

    const response = NextResponse.json({ success: true });
    response.cookies.set(CREATOR_AUTH_COOKIE, "true", cookieOptions);

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid login request." },
      { status: 400 }
    );
  }
}
