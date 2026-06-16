import { NextResponse } from "next/server";
import { complete, hasApiKey, parseJson } from "@/lib/ai";
import { fallbackReport } from "@/lib/fallback";
import { reportPrompt } from "@/lib/prompts";
import { ReportResponseSchema, ReportSchema, type ReportResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = ReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  if (!hasApiKey()) {
    return NextResponse.json(fallbackReport(input));
  }

  try {
    const raw = await complete(reportPrompt(input), { json: true });
    const data = parseJson<Partial<ReportResponse>>(raw);
    const validated = ReportResponseSchema.safeParse({ ...data, demoMode: false });
    if (!validated.success) throw new Error("bad report shape");
    return NextResponse.json(validated.data);
  } catch {
    return NextResponse.json(fallbackReport(input));
  }
}
