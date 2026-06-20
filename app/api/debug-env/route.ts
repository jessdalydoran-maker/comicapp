import { NextResponse } from "next/server";

import { getCreatorPassword } from "@/lib/auth";
import { getAnthropicApiKey } from "@/lib/generateComic";
import {
  getAuthCookieDomain,
  getSiteUrl,
  PRODUCTION_SITE_URL,
} from "@/lib/site";

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
    siteUrl: getSiteUrl(),
    productionSiteUrl: PRODUCTION_SITE_URL,
    authCookieDomain: getAuthCookieDomain() ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
