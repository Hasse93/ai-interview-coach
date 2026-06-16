import { beforeEach, describe, expect, it } from "vitest";
import { fallbackCvAnalysis, fallbackChat } from "@/lib/fallback";
import { CvAnalysisSchema } from "@/lib/types";

beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
});

function post(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const STRONG_CV =
  "Senior Software Engineer. Led a team of 5. Built React + TypeScript apps on AWS with Docker. " +
  "Improved performance by 40% and reduced costs by 25%. Set up CI/CD and test coverage with Vitest. " +
  "Designed distributed microservice architecture handling 10k requests per second.";

describe("fallbackCvAnalysis", () => {
  it("returns a valid analysis shape", () => {
    const a = fallbackCvAnalysis(STRONG_CV, "Software Engineer");
    expect(CvAnalysisSchema.safeParse(a).success).toBe(true);
    expect(a.strengths.length).toBeGreaterThan(0);
    expect(a.weaknesses.length).toBeGreaterThan(0);
  });

  it("scores a signal-rich CV higher than a sparse one", () => {
    const strong = fallbackCvAnalysis(STRONG_CV, "Software Engineer");
    const weak = fallbackCvAnalysis("I worked at a company doing some things.", "Software Engineer");
    expect(strong.fitScore).toBeGreaterThan(weak.fitScore);
  });
});

describe("fallbackChat", () => {
  const base = { role: "SWE", seniority: "mid" as const, interviewType: "behavioral" as const, cvText: "" };

  it("greets when the interview has not started", () => {
    const reply = fallbackChat({ ...base, messages: [] });
    expect(reply.toLowerCase()).toContain("hi");
  });

  it("reacts and asks again after a candidate answer", () => {
    const reply = fallbackChat({
      ...base,
      messages: [
        { role: "interviewer", content: "Tell me about yourself." },
        { role: "candidate", content: "I am a developer." },
      ],
    });
    expect(reply.length).toBeGreaterThan(10);
    expect(reply.endsWith("?")).toBe(true);
  });
});

describe("POST /api/cv (JSON/text path)", () => {
  it("analyzes pasted CV text in demo mode", async () => {
    const { POST } = await import("@/app/api/cv/route");
    const res = await POST(post("http://t/api/cv", { cvText: STRONG_CV, role: "SWE", seniority: "senior" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.demoMode).toBe(true);
    expect(data.cvText.length).toBeGreaterThan(0);
    expect(typeof data.analysis.fitScore).toBe("number");
  });

  it("rejects CV text that is too short", async () => {
    const { POST } = await import("@/app/api/cv/route");
    const res = await POST(post("http://t/api/cv", { cvText: "hi", role: "SWE" }));
    expect(res.status).toBe(422);
  });
});

describe("POST /api/chat", () => {
  it("returns an interviewer opening line in demo mode", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(post("http://t/api/chat", {
      role: "SWE",
      seniority: "mid",
      interviewType: "behavioral",
      messages: [],
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.demoMode).toBe(true);
    expect(typeof data.reply).toBe("string");
    expect(data.reply.length).toBeGreaterThan(5);
  });

  it("rejects an invalid chat request", async () => {
    const { POST } = await import("@/app/api/chat/route");
    const res = await POST(post("http://t/api/chat", { role: "SWE" }));
    expect(res.status).toBe(400);
  });
});
