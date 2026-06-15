import { beforeEach, describe, expect, it } from "vitest";

// Ensure demo-mode (no live API calls) for deterministic API tests.
beforeEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
});

function post(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/questions", () => {
  it("returns questions for a valid setup", async () => {
    const { POST } = await import("@/app/api/questions/route");
    const res = await POST(post("http://t/api/questions", {
      role: "Backend Engineer",
      seniority: "senior",
      interviewType: "technical",
      count: 5,
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.demoMode).toBe(true);
    expect(data.questions).toHaveLength(5);
  });

  it("rejects an invalid setup", async () => {
    const { POST } = await import("@/app/api/questions/route");
    const res = await POST(post("http://t/api/questions", { role: "x" }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/evaluate", () => {
  it("scores an answer", async () => {
    const { POST } = await import("@/app/api/evaluate/route");
    const res = await POST(post("http://t/api/evaluate", {
      role: "SWE",
      seniority: "mid",
      interviewType: "behavioral",
      question: "Tell me about a time you led a project.",
      answer: "I led a migration, implemented it, and reduced costs by 30 percent.",
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(typeof data.score).toBe("number");
    expect(Array.isArray(data.strengths)).toBe(true);
  });

  it("rejects an empty answer", async () => {
    const { POST } = await import("@/app/api/evaluate/route");
    const res = await POST(post("http://t/api/evaluate", {
      role: "SWE",
      seniority: "mid",
      interviewType: "behavioral",
      question: "Q?",
      answer: "",
    }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/report", () => {
  it("builds a report from turns", async () => {
    const { POST } = await import("@/app/api/report/route");
    const res = await POST(post("http://t/api/report", {
      role: "SWE",
      seniority: "senior",
      interviewType: "behavioral",
      turns: [
        { question: "q1", answer: "a1", score: 70 },
        { question: "q2", answer: "a2", score: 90 },
      ],
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.overallScore).toBe(80);
    expect(data.actionItems.length).toBeGreaterThan(0);
  });

  it("rejects empty turns", async () => {
    const { POST } = await import("@/app/api/report/route");
    const res = await POST(post("http://t/api/report", {
      role: "SWE",
      seniority: "senior",
      interviewType: "behavioral",
      turns: [],
    }));
    expect(res.status).toBe(400);
  });
});
