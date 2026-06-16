import { NextResponse } from "next/server";
import { complete, hasApiKey, parseJson } from "@/lib/ai";
import { extractCvText } from "@/lib/cv";
import { fallbackCvAnalysis } from "@/lib/fallback";
import { cvAnalysisPrompt } from "@/lib/prompts";
import { CvAnalysisSchema, type CvAnalysis } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let cvText = "";
  let role = "Software Engineer";
  let seniority = "mid";

  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      role = String(form.get("role") || role);
      seniority = String(form.get("seniority") || seniority);
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      cvText = await extractCvText(file);
    } else {
      // JSON path: { cvText, role, seniority } — used for pasted text & tests.
      const body = await req.json();
      cvText = String(body?.cvText || "");
      role = String(body?.role || role);
      seniority = String(body?.seniority || seniority);
    }
  } catch {
    return NextResponse.json({ error: "Could not read the CV file" }, { status: 400 });
  }

  cvText = cvText.slice(0, 15000);
  if (cvText.trim().length < 30) {
    return NextResponse.json(
      { error: "Couldn't extract enough text from this CV. Try a text-based PDF or paste it instead." },
      { status: 422 },
    );
  }

  if (!hasApiKey()) {
    return NextResponse.json({ analysis: fallbackCvAnalysis(cvText, role), cvText, demoMode: true });
  }

  try {
    const raw = await complete(cvAnalysisPrompt(cvText, role, seniority), { json: true });
    const data = parseJson<Partial<CvAnalysis>>(raw);
    const validated = CvAnalysisSchema.safeParse(data);
    if (!validated.success) throw new Error("bad cv analysis shape");
    return NextResponse.json({ analysis: validated.data, cvText, demoMode: false });
  } catch {
    return NextResponse.json({ analysis: fallbackCvAnalysis(cvText, role), cvText, demoMode: true });
  }
}
