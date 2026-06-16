import { NextResponse } from "next/server";
import { complete, hasApiKey, parseJson } from "@/lib/ai";
import { trySemanticScore } from "@/lib/embeddings";
import { fallbackEvaluate } from "@/lib/fallback";
import { evaluatePrompt } from "@/lib/prompts";
import { rateLimited } from "@/lib/rateLimit";
import { EvaluateSchema, FeedbackSchema, type EvaluateInput, type Feedback } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = rateLimited(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = EvaluateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  // Run LLM judgment and the local embedding relevance score concurrently.
  const [feedback, relevance] = await Promise.all([
    produceFeedback(input),
    trySemanticScore(input.answer, input.question),
  ]);

  return NextResponse.json({ ...feedback, relevance });
}

async function produceFeedback(input: EvaluateInput): Promise<Feedback> {
  if (!hasApiKey()) return fallbackEvaluate(input);
  try {
    const raw = await complete(evaluatePrompt(input), { json: true });
    const data = parseJson<Partial<Feedback>>(raw);
    const validated = FeedbackSchema.safeParse({ ...data, demoMode: false });
    if (!validated.success) throw new Error("bad feedback shape");
    return validated.data;
  } catch {
    return fallbackEvaluate(input);
  }
}
