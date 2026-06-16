"use client";

import { useRef } from "react";
import { CvAnalysisCard } from "@/components/CvAnalysisCard";
import {
  InterviewTypes,
  SeniorityLevels,
  type CvAnalysis,
  type InterviewType,
  type Seniority,
} from "@/lib/types";
import { SENIORITY_LABEL, TYPE_META, type Mode } from "./meta";

type SetupViewProps = {
  role: string;
  setRole: (s: string) => void;
  seniority: Seniority;
  setSeniority: (s: Seniority) => void;
  interviewType: InterviewType;
  setInterviewType: (t: InterviewType) => void;
  jobDescription: string;
  setJobDescription: (s: string) => void;
  count: number;
  setCount: (n: number) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  cvAnalysis: CvAnalysis | null;
  cvSemanticFit: number | null;
  cvLoading: boolean;
  cvName: string;
  analyzeCv: (file: File) => void;
  startInterview: () => void;
};

export function SetupView(p: SetupViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="glass animate-fade-up p-6 sm:p-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Set up your mock interview</h1>
      <p className="mt-2 text-sm text-slate-400">
        Tell the coach who you&apos;re interviewing as. The more specific, the better the questions.
      </p>

      <div className="mt-7 space-y-6">
        {/* Mode */}
        <div>
          <label className="label">Practice format</label>
          <div className="grid gap-2.5 sm:grid-cols-2">
            <button
              onClick={() => p.setMode("structured")}
              className={`chip flex flex-col items-start gap-0.5 py-3 text-left ${p.mode === "structured" ? "chip-on" : "chip-off"}`}
            >
              <span className="font-semibold">🎯 Structured</span>
              <span className="text-xs opacity-80">Q → answer → scored feedback. Best for focused drilling.</span>
            </button>
            <button
              onClick={() => p.setMode("conversation")}
              className={`chip flex flex-col items-start gap-0.5 py-3 text-left ${p.mode === "conversation" ? "chip-on" : "chip-off"}`}
            >
              <span className="font-semibold">💬 Conversation</span>
              <span className="text-xs opacity-80">Free-flowing chat with an AI interviewer. Realistic feel.</span>
            </button>
          </div>
        </div>

        <div>
          <label className="label">Target role</label>
          <input
            className="field"
            value={p.role}
            onChange={(e) => p.setRole(e.target.value)}
            placeholder="e.g. Senior Frontend Engineer, Product Manager"
          />
        </div>

        <div>
          <label className="label">Seniority</label>
          <div className="flex flex-wrap gap-2.5">
            {SeniorityLevels.map((s) => (
              <button key={s} onClick={() => p.setSeniority(s)} className={`chip ${p.seniority === s ? "chip-on" : "chip-off"}`}>
                {SENIORITY_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Interview type</label>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {InterviewTypes.map((t) => (
              <button
                key={t}
                onClick={() => p.setInterviewType(t)}
                className={`chip flex items-center gap-2 ${p.interviewType === t ? "chip-on" : "chip-off"}`}
              >
                <span>{TYPE_META[t].emoji}</span>
                {TYPE_META[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* CV upload */}
        <div>
          <label className="label">
            Upload your CV <span className="font-normal normal-case text-slate-500">(optional — analyzes & tailors questions)</span>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.txt,.md"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) p.analyzeCv(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={p.cvLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/[0.02] px-4 py-5 text-sm text-slate-300 transition hover:border-brand-400/50 hover:bg-white/[0.04] disabled:opacity-60"
          >
            {p.cvLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-brand-400" />
                Analyzing {p.cvName}…
              </>
            ) : p.cvName ? (
              <>📄 {p.cvName} — click to replace</>
            ) : (
              <>⬆️ Upload a PDF or text CV</>
            )}
          </button>
          {p.cvAnalysis && <CvAnalysisCard analysis={p.cvAnalysis} semanticFit={p.cvSemanticFit} />}
        </div>

        <div>
          <label className="label">
            Job description <span className="font-normal normal-case text-slate-500">(optional — tailors questions)</span>
          </label>
          <textarea
            className="field min-h-[90px] resize-y"
            value={p.jobDescription}
            onChange={(e) => p.setJobDescription(e.target.value)}
            placeholder="Paste the job description here to get questions tailored to it…"
          />
        </div>

        {p.mode === "structured" && (
          <div>
            <label className="label">Number of questions: {p.count}</label>
            <input type="range" min={3} max={8} value={p.count} onChange={(e) => p.setCount(Number(e.target.value))} className="w-full accent-brand-500" />
          </div>
        )}

        <button onClick={p.startInterview} disabled={!p.role.trim() || p.cvLoading} className="btn-primary w-full">
          {p.mode === "conversation" ? "Start conversation →" : "Start interview →"}
        </button>
      </div>
    </div>
  );
}
