import { NextResponse } from "next/server";
import { complete, hasApiKey, parseJson } from "@/lib/ai";
import { fallbackQuestions } from "@/lib/fallback";
import { questionsPrompt } from "@/lib/prompts";
import { rateLimited } from "@/lib/rateLimit";
import { SetupSchema, type Question } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = rateLimited(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = SetupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid setup", details: parsed.error.flatten() }, { status: 400 });
  }
  const setup = parsed.data;

  if (!hasApiKey()) {
    return NextResponse.json({ questions: fallbackQuestions(setup), demoMode: true });
  }

  try {
    const raw = await complete(questionsPrompt(setup), { json: true });
    const data = parseJson<{ questions: Question[] }>(raw);
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error("empty questions");
    }
    return NextResponse.json({ questions: data.questions, demoMode: false });
  } catch (err) {
    // Resilient fallback so the user never hits a dead end.
    return NextResponse.json({ questions: fallbackQuestions(setup), demoMode: true });
  }
}
