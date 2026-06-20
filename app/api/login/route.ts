import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { CREATOR_AUTH_COOKIE, getAuthCookieOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// TEMP: hardcoded while diagnosing Vercel env var issues — restore CREATOR_PASSWORD later.
const TEMP_CREATOR_PASSWORD = "ComicForge2025";
const API_VERSION = "hardcoded-v1";

async function parseRequestBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }

  const raw = await request.text();
  console.log("[/api/login] non-JSON raw body:", raw);

  if (!raw.trim()) {
    return {};
  }

  return JSON.parse(raw) as Record<string, unknown>;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/login",
    apiVersion: API_VERSION,
    method: "GET",
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const url = request.url;

  console.log("[/api/login] POST received", { url, contentType });

  try {
    const body = await parseRequestBody(request);

    console.log("[/api/login] request body:", {
      keys: Object.keys(body),
      passwordType: typeof body.password,
      passwordLength:
        typeof body.password === "string" ? body.password.length : null,
      passwordPreview:
        typeof body.password === "string"
          ? `[${body.password.length} chars]`
          : body.password,
      rawBody: body,
    });

    const password =
      typeof body.password === "string" ? body.password.trim() : "";

    if (password !== TEMP_CREATOR_PASSWORD) {
      return NextResponse.json(
        {
          error: "Wrong password. This is a private creator studio.",
          debug: {
            apiVersion: API_VERSION,
            apiReached: true,
            receivedPasswordLength: password.length,
            expectedPasswordLength: TEMP_CREATOR_PASSWORD.length,
            contentType,
          },
        },
        {
          status: 401,
          headers: { "X-Login-Api-Version": API_VERSION },
        }
      );
    }

    const cookieStore = cookies();
    cookieStore.set(CREATOR_AUTH_COOKIE, "true", getAuthCookieOptions());

    console.log("[/api/login] auth cookie set", {
      cookie: CREATOR_AUTH_COOKIE,
      secure: getAuthCookieOptions().secure,
    });

    return NextResponse.json(
      { success: true, debug: { apiVersion: API_VERSION, apiReached: true } },
      { headers: { "X-Login-Api-Version": API_VERSION } }
    );
  } catch (error) {
    console.error("[/api/login] handler error:", error);

    return NextResponse.json(
      {
        error: "Invalid login request.",
        debug: {
          apiVersion: API_VERSION,
          apiReached: true,
          message: error instanceof Error ? error.message : "unknown error",
          contentType,
        },
      },
      { status: 400 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      Allow: "GET, POST, OPTIONS",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
