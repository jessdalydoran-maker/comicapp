import { NextResponse } from "next/server";

import {
  CREATOR_AUTH_COOKIE,
  getAuthCookieOptions,
  getCreatorPassword,
  verifyCreatorPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";

    const expected = getCreatorPassword();

    if (!expected) {
      return NextResponse.json(
        {
          error:
            "Creator password is not configured on the server. Set CREATOR_PASSWORD in Vercel environment variables for Production.",
        },
        { status: 500 }
      );
    }

    if (!verifyCreatorPassword(password)) {
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
