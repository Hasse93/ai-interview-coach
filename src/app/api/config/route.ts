import { NextResponse } from "next/server";
import { activeProvider, hasApiKey } from "@/lib/ai";

export const runtime = "nodejs";

/** Reports whether a live AI provider is configured (drives the UI banner). */
export async function GET() {
  return NextResponse.json({ aiConfigured: hasApiKey(), provider: activeProvider() });
}
