import { NextResponse } from "next/server";
import { complete, hasApiKey, parseJson } from "@/lib/ai";
import { fallbackEvaluate } from "@/lib/fallback";
import { evaluatePrompt } from "@/lib/prompts";
import { EvaluateSchema, FeedbackSchema, type Feedback } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = EvaluateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  if (!hasApiKey()) {
    return NextResponse.json(fallbackEvaluate(input));
  }

  try {
    const raw = await complete(evaluatePrompt(input), { json: true });
    const data = parseJson<Partial<Feedback>>(raw);
    const validated = FeedbackSchema.safeParse({ ...data, demoMode: false });
    if (!validated.success) throw new Error("bad feedback shape");
    return NextResponse.json(validated.data);
  } catch {
    return NextResponse.json(fallbackEvaluate(input));
  }
}
