"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage, InterviewType, Seniority } from "@/lib/types";
import { SENIORITY_LABEL, TYPE_META, type SpeechControls } from "./meta";

type ChatViewProps = {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (s: string) => void;
  chatLoading: boolean;
  sendChat: () => void;
  finishConversation: () => void;
  speech: SpeechControls;
  meta: { role: string; seniority: Seniority; interviewType: InterviewType };
};

export function ChatView(p: ChatViewProps) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [p.messages, p.chatLoading]);

  const answered = p.messages.filter((m) => m.role === "candidate").length;

  return (
    <div className="animate-fade-up space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">
          {SENIORITY_LABEL[p.meta.seniority]} {p.meta.role} · {TYPE_META[p.meta.interviewType].label} · live conversation
        </div>
        <button onClick={p.finishConversation} disabled={answered === 0 || p.chatLoading} className="btn-ghost px-3 py-1.5 text-xs">
          End & get report →
        </button>
      </div>

      <div className="glass flex h-[480px] flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {p.messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "candidate" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  m.role === "candidate"
                    ? "rounded-br-sm bg-brand-500 text-white"
                    : "rounded-bl-sm border border-white/10 bg-white/[0.04] text-slate-100"
                }`}
              >
                {m.role === "interviewer" && (
                  <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-300">Interviewer</div>
                )}
                {m.role === "interviewer" && m.content === "" ? (
                  <span className="flex gap-1.5 py-1">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${d * 0.15}s` }} />
                    ))}
                  </span>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex items-end gap-2">
            {p.speech.supported && (
              <button
                onClick={() => (p.speech.listening ? p.speech.stop() : p.speech.start())}
                className={`btn h-11 w-11 flex-shrink-0 p-0 ${p.speech.listening ? "bg-red-500/20 text-red-200" : "border border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.08]"}`}
                title={p.speech.listening ? "Stop recording" : "Answer by voice"}
              >
                {p.speech.listening ? "●" : "🎙️"}
              </button>
            )}
            <textarea
              className="field max-h-32 min-h-[44px] flex-1 resize-none py-3"
              rows={1}
              value={p.chatInput}
              onChange={(e) => p.setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  p.sendChat();
                }
              }}
              placeholder={p.speech.listening ? "Listening…" : "Type your answer… (Enter to send)"}
            />
            <button onClick={p.sendChat} disabled={!p.chatInput.trim() || p.chatLoading} className="btn-primary h-11 flex-shrink-0">
              Send
            </button>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-slate-500">
        Answer naturally — when you&apos;re done, click <span className="text-slate-300">End &amp; get report</span> for your scorecard.
      </p>
    </div>
  );
}
