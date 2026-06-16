"use client";

import type { ReportResponse, Seniority, InterviewType } from "./types";

const KEY = "aic.history.v1";

export type HistoryEntry = {
  id: string;
  date: string; // ISO
  role: string;
  seniority: Seniority;
  interviewType: InterviewType;
  overallScore: number;
  report: ReportResponse;
};

export function loadHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(entry: HistoryEntry): HistoryEntry[] {
  const all = [entry, ...loadHistory()].slice(0, 50);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* ignore quota errors */
  }
  return all;
}

export function clearHistory() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Populate localStorage with realistic sample sessions so a first-time visitor
 * can explore a fully-populated dashboard without doing a whole interview.
 */
export function seedSampleHistory(): HistoryEntry[] {
  const now = Date.now();
  const DAY = 86_400_000;
  const dims = (c: number, d: number, s: number, i: number) => [
    { name: "Communication", score: c },
    { name: "Depth", score: d },
    { name: "Structure", score: s },
    { name: "Impact", score: i },
  ];
  const mk = (
    daysAgo: number,
    role: string,
    seniority: Seniority,
    interviewType: InterviewType,
    overall: number,
    dimensions: ReportResponse["dimensions"],
    summary: string,
  ): HistoryEntry => ({
    id: `sample-${daysAgo}-${interviewType}`,
    date: new Date(now - daysAgo * DAY).toISOString(),
    role,
    seniority,
    interviewType,
    overallScore: overall,
    report: {
      overallScore: overall,
      summary,
      dimensions,
      actionItems: [
        "Use the STAR framework for every behavioral answer.",
        "End each answer with a measurable result.",
        "Practice out loud to keep answers under 90 seconds.",
      ],
      demoMode: true,
    },
  });

  const sample: HistoryEntry[] = [
    mk(14, "Frontend Engineer", "mid", "behavioral", 61, dims(66, 58, 55, 64),
      "A solid start. Your fundamentals are there; focus on structure and quantified outcomes."),
    mk(10, "Frontend Engineer", "mid", "technical", 68, dims(70, 66, 62, 70),
      "Good technical instincts. Tighten how you explain trade-offs and validation."),
    mk(6, "Frontend Engineer", "mid", "system-design", 73, dims(74, 70, 70, 75),
      "Promising system-design thinking. Lead with requirements and surface bottlenecks earlier."),
    mk(3, "Frontend Engineer", "senior", "behavioral", 79, dims(82, 76, 78, 80),
      "Strong, structured storytelling with clear ownership. Keep quantifying impact."),
    mk(1, "Frontend Engineer", "senior", "technical", 85, dims(86, 84, 82, 88),
      "Excellent — confident, concise, and backed by metrics. Interview-ready."),
  ];

  try {
    window.localStorage.setItem(KEY, JSON.stringify(sample));
  } catch {
    /* ignore quota errors */
  }
  return sample;
}
