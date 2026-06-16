import { NextResponse } from "next/server";
import { complete, hasApiKey } from "@/lib/ai";
import { fallbackChat } from "@/lib/fallback";
import { chatPrompt } from "@/lib/prompts";
import { ChatRequestSchema } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  if (!hasApiKey()) {
    return NextResponse.json({ reply: fallbackChat(input), demoMode: true });
  }

  try {
    const reply = (await complete(chatPrompt(input), { maxTokens: 500 })).trim();
    if (!reply) throw new Error("empty reply");
    return NextResponse.json({ reply, demoMode: false });
  } catch {
    return NextResponse.json({ reply: fallbackChat(input), demoMode: true });
  }
}
