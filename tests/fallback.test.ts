import { describe, expect, it } from "vitest";
import { fallbackQuestions, fallbackEvaluate, fallbackReport } from "@/lib/fallback";
import { FeedbackSchema, QuestionSchema, ReportResponseSchema } from "@/lib/types";

describe("fallbackQuestions", () => {
  it("returns the requested count and valid shape", () => {
    const qs = fallbackQuestions({
      role: "Software Engineer",
      seniority: "senior",
      interviewType: "technical",
      jobDescription: "",
      cvText: "",
      count: 4,
    });
    expect(qs).toHaveLength(4);
    qs.forEach((q) => expect(QuestionSchema.safeParse(q).success).toBe(true));
  });

  it("varies questions by interview type", () => {
    const base = { role: "PM", seniority: "mid" as const, jobDescription: "", cvText: "", count: 3 };
    const beh = fallbackQuestions({ ...base, interviewType: "behavioral" });
    const sys = fallbackQuestions({ ...base, interviewType: "system-design" });
    expect(beh[0].prompt).not.toEqual(sys[0].prompt);
  });
});

describe("fallbackEvaluate", () => {
  const input = {
    role: "Software Engineer",
    seniority: "mid" as const,
    interviewType: "behavioral" as const,
    question: "Tell me about a conflict.",
  };

  it("produces a valid, bounded score", () => {
    const fb = fallbackEvaluate({ ...input, answer: "We disagreed and I talked to them." });
    expect(FeedbackSchema.safeParse(fb).success).toBe(true);
    expect(fb.score).toBeGreaterThanOrEqual(0);
    expect(fb.score).toBeLessThanOrEqual(100);
  });

  it("rewards longer, structured, quantified answers", () => {
    const weak = fallbackEvaluate({ ...input, answer: "It was fine." });
    const strong = fallbackEvaluate({
      ...input,
      answer:
        "When our team was behind on a release, I needed to unblock the API work. " +
        "I designed a migration plan, implemented the changes, and led daily syncs. " +
        "As a result we shipped two weeks early and reduced errors by 40 percent.",
    });
    expect(strong.score).toBeGreaterThan(weak.score);
  });

  it("detects STAR result component via metrics", () => {
    const fb = fallbackEvaluate({
      ...input,
      answer: "As a result we increased revenue by 25 percent.",
    });
    expect(fb.star.result).toBe(true);
  });

  it("always returns at least one strength and improvement", () => {
    const fb = fallbackEvaluate({ ...input, answer: "x" });
    expect(fb.strengths.length).toBeGreaterThan(0);
    expect(fb.improvements.length).toBeGreaterThan(0);
  });
});

describe("fallbackReport", () => {
  it("averages turn scores and returns valid shape", () => {
    const report = fallbackReport({
      role: "SWE",
      seniority: "senior",
      interviewType: "behavioral",
      turns: [
        { question: "q1", answer: "a1", score: 60 },
        { question: "q2", answer: "a2", score: 80 },
      ],
    });
    expect(report.overallScore).toBe(70);
    expect(ReportResponseSchema.safeParse(report).success).toBe(true);
    expect(report.dimensions.length).toBeGreaterThan(0);
  });

  it("clamps dimension scores within 0-100", () => {
    const report = fallbackReport({
      role: "SWE",
      seniority: "junior",
      interviewType: "technical",
      turns: [{ question: "q", answer: "a", score: 99 }],
    });
    report.dimensions.forEach((d) => {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
    });
  });
});
