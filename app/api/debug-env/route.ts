import { NextResponse } from "next/server";

import { getCreatorPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const password = getCreatorPassword();

  return NextResponse.json({
    creatorPasswordSet: password != null,
    creatorPasswordLength: password?.length ?? 0,
    nodeEnv: process.env.NODE_ENV ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  });
}
