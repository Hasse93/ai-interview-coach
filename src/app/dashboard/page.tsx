"use client";

import { useEffect, useMemo, useState } from "react";
import { ScoreRing } from "@/components/ScoreRing";
import { clearHistory, loadHistory, type HistoryEntry } from "@/lib/storage";
import type { InterviewType } from "@/lib/types";

const TYPE_LABEL: Record<InterviewType, string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  "system-design": "System Design",
};

export default function DashboardPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  useEffect(() => setHistory(loadHistory()), []);

  const stats = useMemo(() => {
    if (!history.length) return null;
    const scores = history.map((h) => h.overallScore);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    const best = Math.max(...scores);
    // chronological order for the trend line
    const chrono = [...history].reverse();

    const byType: Record<string, number[]> = {};
    for (const h of history) (byType[h.interviewType] ??= []).push(h.overallScore);

    const dims: Record<string, number[]> = {};
    for (const h of history) for (const d of h.report.dimensions) (dims[d.name] ??= []).push(d.score);
    const dimAvg = Object.entries(dims)
      .map(([name, arr]) => ({ name, score: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) }))
      .sort((a, b) => a.score - b.score);

    return { avg, best, count: history.length, chrono, byType, dimAvg };
  }, [history]);

  if (!stats) {
    return (
      <div className="glass mx-auto mt-10 max-w-lg p-10 text-center">
        <div className="text-4xl">📊</div>
        <h1 className="mt-4 text-2xl font-bold">No sessions yet</h1>
        <p className="mt-2 text-sm text-slate-400">Complete a mock interview and your progress will show up here.</p>
        <a href="/interview" className="btn-primary mt-6">Start your first interview →</a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Progress across {stats.count} interview{stats.count > 1 ? "s" : ""}.</p>
        </div>
        <div className="flex gap-2">
          <a href="/interview" className="btn-primary">New interview →</a>
          <button
            onClick={() => {
              clearHistory();
              setHistory([]);
            }}
            className="btn-ghost"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard label="Average score" value={stats.avg} ring />
        <StatCard label="Best score" value={stats.best} ring />
        <StatCard label="Sessions" value={stats.count} />
      </div>

      {/* Trend */}
      <div className="glass p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Score trend</h3>
        <TrendChart points={stats.chrono.map((h) => h.overallScore)} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* By type */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Average by interview type</h3>
          <div className="mt-4 space-y-3.5">
            {Object.entries(stats.byType).map(([type, arr]) => {
              const a = Math.round(arr.reduce((x, y) => x + y, 0) / arr.length);
              return (
                <div key={type}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-300">{TYPE_LABEL[type as InterviewType] ?? type}</span>
                    <span className="font-semibold tabular-nums">{a} <span className="text-xs text-slate-500">· {arr.length}×</span></span>
                  </div>
                  <Bar value={a} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Weakest dimensions */}
        <div className="glass p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Skills — weakest first</h3>
          <div className="mt-4 space-y-3.5">
            {stats.dimAvg.map((d) => (
              <div key={d.name}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-slate-300">{d.name}</span>
                  <span className="font-semibold tabular-nums">{d.score}</span>
                </div>
                <Bar value={d.score} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* History list */}
      <div className="glass p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Recent sessions</h3>
        <div className="mt-4 divide-y divide-white/5">
          {stats.chrono.slice().reverse().map((h) => (
            <div key={h.id} className="flex items-center justify-between py-3">
              <div className="min-w-0">
                <div className="truncate font-medium text-slate-200">{h.role}</div>
                <div className="text-xs text-slate-500">
                  {TYPE_LABEL[h.interviewType] ?? h.interviewType} · {new Date(h.date).toLocaleString()}
                </div>
              </div>
              <span className={`ml-3 text-lg font-bold tabular-nums ${h.overallScore >= 75 ? "text-accent-400" : h.overallScore >= 55 ? "text-brand-300" : "text-amber-300"}`}>
                {h.overallScore}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, ring }: { label: string; value: number; ring?: boolean }) {
  return (
    <div className="glass flex items-center gap-4 p-6">
      {ring ? (
        <ScoreRing score={value} size={84} />
      ) : (
        <span className="text-4xl font-bold tabular-nums text-brand-300">{value}</span>
      )}
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

function Bar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-700" style={{ width: `${value}%` }} />
    </div>
  );
}

function TrendChart({ points }: { points: number[] }) {
  const w = 640;
  const h = 160;
  const pad = 24;
  if (points.length === 1) points = [points[0], points[0]];
  const max = 100;
  const stepX = (w - pad * 2) / Math.max(1, points.length - 1);
  const coords = points.map((p, i) => {
    const x = pad + i * stepX;
    const y = h - pad - (p / max) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${line} L ${coords[coords.length - 1][0].toFixed(1)} ${h - pad} L ${pad} ${h - pad} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-4 w-full" preserveAspectRatio="none" style={{ height: 180 }}>
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(91,108,255,0.35)" />
          <stop offset="100%" stopColor="rgba(91,108,255,0)" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((g) => {
        const y = h - pad - (g / max) * (h - pad * 2);
        return <line key={g} x1={pad} y1={y} x2={w - pad} y2={y} stroke="rgba(255,255,255,0.06)" />;
      })}
      <path d={area} fill="url(#trendFill)" />
      <path d={line} fill="none" stroke="#7c8bff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill="#3ee0c4" />
      ))}
    </svg>
  );
}
