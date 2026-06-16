"use client";

import { ScoreRing } from "@/components/ScoreRing";
import type { InterviewType, ReportResponse, Seniority } from "@/lib/types";
import { SENIORITY_LABEL, TYPE_META } from "./meta";

type ReportViewProps = {
  report: ReportResponse;
  role: string;
  seniority: Seniority;
  interviewType: InterviewType;
  reset: () => void;
};

export function ReportView({ report, role, seniority, interviewType, reset }: ReportViewProps) {
  return (
    <div className="animate-fade-up space-y-5">
      <div className="glass p-6 text-center sm:p-8">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {SENIORITY_LABEL[seniority]} {role} · {TYPE_META[interviewType].label}
        </div>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Your interview report</h1>
        <div className="mt-6 flex justify-center">
          <ScoreRing score={report.overallScore} size={160} label="overall" />
        </div>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-300">{report.summary}</p>
      </div>

      <div className="glass p-6 sm:p-7">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Breakdown</h3>
        <div className="mt-4 space-y-3.5">
          {report.dimensions.map((d) => (
            <div key={d.name}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-300">{d.name}</span>
                <span className="font-semibold tabular-nums">{d.score}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-700" style={{ width: `${d.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-6 sm:p-7">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Work on this next</h3>
        <ul className="mt-4 space-y-2.5">
          {report.actionItems.map((a, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-300">
              <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-md bg-brand-500/20 text-xs font-bold text-brand-300">{i + 1}</span>
              {a}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button onClick={reset} className="btn-primary flex-1">Practice again →</button>
        <a href="/dashboard" className="btn-ghost flex-1 text-center">View dashboard</a>
      </div>
    </div>
  );
}
