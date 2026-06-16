import { NextResponse } from "next/server";
import { complete, hasApiKey, parseJson } from "@/lib/ai";
import { extractCvText } from "@/lib/cv";
import { trySemanticScore } from "@/lib/embeddings";
import { fallbackCvAnalysis } from "@/lib/fallback";
import { cvAnalysisPrompt } from "@/lib/prompts";
import { rateLimited } from "@/lib/rateLimit";
import { CvAnalysisSchema, type CvAnalysis } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = rateLimited(req);
  if (limited) return limited;

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

  // Local ML: semantic match of the CV against the target role (0–100).
  const target = `${seniority} ${role} — required skills, experience and responsibilities`;
  const semanticFitPromise = trySemanticScore(cvText, target);

  if (!hasApiKey()) {
    const [semanticFit] = await Promise.all([semanticFitPromise]);
    return NextResponse.json({ analysis: fallbackCvAnalysis(cvText, role), semanticFit, cvText, demoMode: true });
  }

  try {
    const [raw, semanticFit] = await Promise.all([
      complete(cvAnalysisPrompt(cvText, role, seniority), { json: true }),
      semanticFitPromise,
    ]);
    const data = parseJson<Partial<CvAnalysis>>(raw);
    const validated = CvAnalysisSchema.safeParse(data);
    if (!validated.success) throw new Error("bad cv analysis shape");
    return NextResponse.json({ analysis: validated.data, semanticFit, cvText, demoMode: false });
  } catch {
    const semanticFit = await semanticFitPromise;
    return NextResponse.json({ analysis: fallbackCvAnalysis(cvText, role), semanticFit, cvText, demoMode: true });
  }
}
