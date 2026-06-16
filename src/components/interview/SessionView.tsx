"use client";

import type { Feedback, Question } from "@/lib/types";
import { FeedbackCard } from "./FeedbackCard";
import type { SpeechControls } from "./meta";

type SessionViewProps = {
  question: Question;
  idx: number;
  total: number;
  progress: number;
  answer: string;
  setAnswer: (s: string) => void;
  feedback: Feedback | null;
  evaluating: boolean;
  submitAnswer: () => void;
  nextQuestion: () => void;
  speech: SpeechControls;
  isLast: boolean;
};

export function SessionView(p: SessionViewProps) {
  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
          <span>Question {p.idx + 1} of {p.total}</span>
          <span>{p.progress}% complete</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-500" style={{ width: `${p.progress}%` }} />
        </div>
      </div>

      <div className="glass p-6 sm:p-7">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-300">Interviewer</div>
        <h2 className="mt-2 text-xl font-semibold leading-snug">{p.question.prompt}</h2>
        {p.question.rationale && <p className="mt-3 text-xs text-slate-500">💡 {p.question.rationale}</p>}
      </div>

      {!p.feedback && (
        <div className="glass p-6 sm:p-7">
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0">Your answer</label>
            {p.speech.supported && (
              <button
                onClick={() => (p.speech.listening ? p.speech.stop() : p.speech.start())}
                className={`btn px-3 py-1.5 text-xs ${p.speech.listening ? "bg-red-500/20 text-red-200 hover:bg-red-500/30" : "border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]"}`}
              >
                {p.speech.listening ? "● Stop recording" : "🎙️ Answer by voice"}
              </button>
            )}
          </div>
          <textarea
            className="field min-h-[150px] resize-y"
            value={p.answer}
            onChange={(e) => p.setAnswer(e.target.value)}
            placeholder={p.speech.listening ? "Listening… speak your answer." : "Type your answer, or use the mic to speak it…"}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {p.answer.trim() ? `${p.answer.trim().split(/\s+/).length} words` : "Aim for 45–90 seconds spoken"}
            </span>
            <button onClick={p.submitAnswer} disabled={!p.answer.trim() || p.evaluating} className="btn-primary">
              {p.evaluating ? "Evaluating…" : "Submit answer"}
            </button>
          </div>
        </div>
      )}

      {p.feedback && <FeedbackCard feedback={p.feedback} onNext={p.nextQuestion} isLast={p.isLast} />}
    </div>
  );
}
