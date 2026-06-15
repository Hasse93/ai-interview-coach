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
