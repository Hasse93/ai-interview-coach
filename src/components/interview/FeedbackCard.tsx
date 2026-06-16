"use client";

import { ScoreRing } from "@/components/ScoreRing";
import type { Feedback } from "@/lib/types";

export function FeedbackCard({ feedback, onNext, isLast }: { feedback: Feedback; onNext: () => void; isLast: boolean }) {
  const star = feedback.star;
  return (
    <div className="glass animate-fade-up p-6 sm:p-7">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ScoreRing score={feedback.score} label="score" />
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent-400">Coach feedback</div>
          <p className="mt-1.5 text-lg font-medium leading-snug">{feedback.verdict}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(["situation", "task", "action", "result"] as const).map((k) => (
              <span key={k} className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${star[k] ? "bg-accent-500/20 text-accent-400" : "bg-white/5 text-slate-500"}`}>
                {star[k] ? "✓" : "○"} {k}
              </span>
            ))}
            {typeof feedback.relevance === "number" && (
              <span
                className="rounded-lg bg-brand-500/15 px-2.5 py-1 text-xs font-medium text-brand-200"
                title="Embedding-based cosine similarity between your answer and the question"
              >
                ◎ {feedback.relevance}% on-topic
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-accent-400">What worked</h4>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
            {feedback.strengths.map((s, i) => (<li key={i} className="flex gap-2"><span className="text-accent-400">+</span>{s}</li>))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-amber-300">What to improve</h4>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-300">
            {feedback.improvements.map((s, i) => (<li key={i} className="flex gap-2"><span className="text-amber-300">→</span>{s}</li>))}
          </ul>
        </div>
      </div>

      <details className="group mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
        <summary className="cursor-pointer list-none text-sm font-semibold text-slate-200">
          ✨ See a model answer
          <span className="ml-2 text-xs font-normal text-slate-500 group-open:hidden">(click to reveal)</span>
        </summary>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{feedback.modelAnswer}</p>
      </details>

      {feedback.followUp && (
        <div className="mt-4 rounded-xl border border-brand-400/20 bg-brand-500/10 p-4 text-sm">
          <span className="font-semibold text-brand-300">Likely follow-up: </span>
          <span className="text-slate-200">{feedback.followUp}</span>
        </div>
      )}

      <button onClick={onNext} className="btn-primary mt-6 w-full">
        {isLast ? "Finish & see report →" : "Next question →"}
      </button>
    </div>
  );
}
