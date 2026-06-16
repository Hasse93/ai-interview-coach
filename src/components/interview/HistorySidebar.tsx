"use client";

import { useMemo } from "react";
import type { HistoryEntry } from "@/lib/storage";
import { TYPE_META } from "./meta";

type HistorySidebarProps = {
  history: HistoryEntry[];
  signedIn: boolean;
  onClear: () => void;
};

export function HistorySidebar({ history, signedIn, onClear }: HistorySidebarProps) {
  const avg = useMemo(
    () => (history.length ? Math.round(history.reduce((s, h) => s + h.overallScore, 0) / history.length) : 0),
    [history],
  );
  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      {!signedIn && (
        <div className="glass border-brand-400/20 bg-brand-500/10 p-4 text-xs text-slate-300">
          <span className="font-semibold text-brand-200">Saving locally.</span>{" "}
          <a href="/signup" className="text-brand-300 underline">Create an account</a> to sync your
          history across your laptop and phone.
        </div>
      )}
      <div className="glass p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Your progress</h3>
          {history.length > 0 && (
            <a href="/dashboard" className="text-xs text-brand-300 hover:underline">Dashboard →</a>
          )}
        </div>
        {history.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">Finish an interview to start tracking your scores.</p>
        ) : (
          <>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-bold tabular-nums text-brand-300">{avg}</span>
              <span className="text-xs text-slate-500">avg · {history.length} session{history.length > 1 ? "s" : ""}</span>
            </div>
            <ul className="mt-4 space-y-2">
              {history.slice(0, 6).map((h) => (
                <li key={h.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-slate-200">{h.role}</div>
                    <div className="text-slate-500">{TYPE_META[h.interviewType].label} · {new Date(h.date).toLocaleDateString()}</div>
                  </div>
                  <span className={`ml-2 font-bold tabular-nums ${h.overallScore >= 75 ? "text-accent-400" : h.overallScore >= 55 ? "text-brand-300" : "text-amber-300"}`}>{h.overallScore}</span>
                </li>
              ))}
            </ul>
            <button onClick={onClear} className="mt-4 text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline">Clear history</button>
          </>
        )}
      </div>
    </aside>
  );
}
