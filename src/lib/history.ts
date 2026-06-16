"use client";

import { loadHistory, saveSession, type HistoryEntry } from "./storage";
import type { ClientUser } from "./useUser";

/**
 * Unified history layer: signed-in users read/write the database; everyone
 * else falls back to localStorage. Keeps the app fully usable without an
 * account while giving logged-in users cross-device sync.
 */

export async function fetchHistory(user: ClientUser): Promise<HistoryEntry[]> {
  if (!user) return loadHistory();
  try {
    const res = await fetch("/api/sessions");
    if (!res.ok) return loadHistory();
    const data = await res.json();
    return (data.sessions ?? []) as HistoryEntry[];
  } catch {
    return loadHistory();
  }
}

export async function persistSession(entry: HistoryEntry, user: ClientUser): Promise<void> {
  // Always keep a local copy so logged-out review still works.
  saveSession(entry);
  if (!user) return;
  try {
    await fetch("/api/sessions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: entry.role,
        seniority: entry.seniority,
        interviewType: entry.interviewType,
        overallScore: entry.overallScore,
        report: entry.report,
      }),
    });
  } catch {
    /* offline — local copy still saved */
  }
}
