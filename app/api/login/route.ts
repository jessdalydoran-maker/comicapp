import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body.password === "string" ? body.password : "";

    const expected = process.env.CREATOR_PASSWORD;

    if (!expected) {
      return NextResponse.json(
        { error: "Creator password is not configured on the server." },
        { status: 500 }
      );
    }

    if (password !== expected) {
      return NextResponse.json(
        { error: "Wrong password. This is a private creator studio." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("creator_auth", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid login request." },
      { status: 400 }
    );
  }
}
