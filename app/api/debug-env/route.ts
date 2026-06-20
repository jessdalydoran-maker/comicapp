import { NextResponse } from "next/server";

import { getCreatorPassword } from "@/lib/auth";
import { getAnthropicApiKey } from "@/lib/generateComic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const password = getCreatorPassword();
  const anthropicApiKey = getAnthropicApiKey();

  return NextResponse.json({
    endpoint: "/api/debug-env",
    creatorPasswordSet: password != null,
    creatorPasswordLength: password?.length ?? 0,
    anthropicApiKeySet: anthropicApiKey != null,
    anthropicApiKeyLength: anthropicApiKey?.length ?? 0,
    nodeEnv: process.env.NODE_ENV ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
