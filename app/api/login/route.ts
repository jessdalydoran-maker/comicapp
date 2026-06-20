import { NextResponse } from "next/server";

import { CREATOR_AUTH_COOKIE, getAuthCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// TEMP: hardcoded while diagnosing Vercel env var issues — restore CREATOR_PASSWORD later.
const TEMP_CREATOR_PASSWORD = "ComicForge2025";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (password !== TEMP_CREATOR_PASSWORD) {
      return NextResponse.json(
        { error: "Wrong password. This is a private creator studio." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(CREATOR_AUTH_COOKIE, "true", getAuthCookieOptions());

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid login request." },
      { status: 400 }
    );
  }
}
