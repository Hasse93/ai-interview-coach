"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ScoreRing } from "@/components/ScoreRing";
import { CvAnalysisCard } from "@/components/CvAnalysisCard";
import { useSpeech } from "@/lib/useSpeech";
import { clearHistory, type HistoryEntry } from "@/lib/storage";
import { fetchHistory, persistSession } from "@/lib/history";
import { useUser } from "@/lib/useUser";
import {
  InterviewTypes,
  SeniorityLevels,
  type ChatMessage,
  type CvAnalysis,
  type Feedback,
  type InterviewType,
  type Question,
  type ReportResponse,
  type Seniority,
  type Turn,
} from "@/lib/types";

type Phase = "setup" | "loading" | "session" | "chat" | "report";
type Mode = "structured" | "conversation";

const TYPE_META: Record<InterviewType, { label: string; emoji: string }> = {
  behavioral: { label: "Behavioral", emoji: "💬" },
  technical: { label: "Technical", emoji: "⚙️" },
  "system-design": { label: "System Design", emoji: "🏗️" },
};
const SENIORITY_LABEL: Record<Seniority, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  staff: "Staff+",
};

export default function InterviewPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [mode, setMode] = useState<Mode>("structured");

  // Setup
  const [role, setRole] = useState("Software Engineer");
  const [seniority, setSeniority] = useState<Seniority>("mid");
  const [interviewType, setInterviewType] = useState<InterviewType>("behavioral");
  const [jobDescription, setJobDescription] = useState("");
  const [count, setCount] = useState(5);

  // CV
  const [cvText, setCvText] = useState("");
  const [cvAnalysis, setCvAnalysis] = useState<CvAnalysis | null>(null);
  const [cvLoading, setCvLoading] = useState(false);
  const [cvName, setCvName] = useState("");

  // Structured session
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);

  // Conversation session
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const [demoMode, setDemoMode] = useState(false);
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // One speech instance routed to the active input by phase.
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const speech = useSpeech((t) => (phaseRef.current === "chat" ? setChatInput(t) : setAnswer(t)));

  const { user } = useUser();
  useEffect(() => {
    fetchHistory(user).then(setHistory);
  }, [user]);

  // Whether a live AI provider is actually configured on the server.
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setAiConfigured(Boolean(d.aiConfigured)))
      .catch(() => setAiConfigured(null));
  }, []);

  const progress = questions.length ? Math.round((idx / questions.length) * 100) : 0;

  async function analyzeCv(file: File) {
    setError(null);
    setCvLoading(true);
    setCvName(file.name);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("role", role);
      form.append("seniority", seniority);
      const res = await fetch("/api/cv", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't analyze the CV");
      setCvText(data.cvText);
      setCvAnalysis(data.analysis);
      setDemoMode((d) => d || data.demoMode);
    } catch (e: any) {
      setError(e.message ?? "CV analysis failed");
      setCvName("");
    } finally {
      setCvLoading(false);
    }
  }

  async function startInterview() {
    setError(null);
    if (mode === "conversation") return startConversation();
    setPhase("loading");
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, seniority, interviewType, jobDescription, cvText, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate questions");
      setQuestions(data.questions);
      setDemoMode((d) => d || Boolean(data.demoMode));
      setIdx(0);
      setTurns([]);
      setAnswer("");
      setFeedback(null);
      setPhase("session");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
      setPhase("setup");
    }
  }

  async function submitAnswer() {
    if (!answer.trim()) return;
    if (speech.listening) speech.stop();
    setEvaluating(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, seniority, interviewType, question: questions[idx].prompt, answer }),
      });
      const data: Feedback = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Evaluation failed");
      setFeedback(data);
      setDemoMode((d) => d || data.demoMode);
      setTurns((t) => [...t, { question: questions[idx].prompt, answer, score: data.score }]);
    } catch (e: any) {
      setError(e.message ?? "Evaluation failed");
    } finally {
      setEvaluating(false);
    }
  }

  function nextQuestion() {
    setFeedback(null);
    setAnswer("");
    if (idx + 1 < questions.length) setIdx((i) => i + 1);
    else buildReport(turns);
  }

  /* ----------------------------- Conversation ----------------------------- */

  async function startConversation() {
    setPhase("chat");
    setMessages([]);
    setChatInput("");
    await sendToInterviewer([]);
  }

  async function sendToInterviewer(history: ChatMessage[]) {
    setChatLoading(true);
    setError(null);
    // Optimistic empty interviewer bubble that fills as tokens stream in.
    setMessages([...history, { role: "interviewer", content: "" }]);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, seniority, interviewType, cvText, messages: history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Chat failed");
      }
      setDemoMode((d) => d || res.headers.get("x-demo-mode") === "true");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "interviewer", content: acc }]);
      }
    } catch (e: any) {
      setError(e.message ?? "Chat failed");
      setMessages(history); // drop the placeholder on failure
    } finally {
      setChatLoading(false);
    }
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    if (speech.listening) speech.stop();
    const next: ChatMessage[] = [...messages, { role: "candidate", content: chatInput.trim() }];
    setMessages(next);
    setChatInput("");
    await sendToInterviewer(next);
  }

  async function finishConversation() {
    // Pair each candidate answer with the interviewer question that preceded it.
    const pairs: { question: string; answer: string }[] = [];
    for (let i = 0; i < messages.length; i++) {
      if (messages[i].role === "candidate") {
        const q =
          [...messages.slice(0, i)].reverse().find((m) => m.role === "interviewer")?.content ??
          "Interview question";
        pairs.push({ question: q, answer: messages[i].content });
      }
    }
    if (pairs.length === 0) {
      setError("Answer at least one question before ending the interview.");
      return;
    }
    setPhase("loading");
    try {
      const scored: Turn[] = await Promise.all(
        pairs.map(async (p) => {
          const res = await fetch("/api/evaluate", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ role, seniority, interviewType, question: p.question, answer: p.answer }),
          });
          const fb: Feedback = await res.json();
          return { question: p.question, answer: p.answer, score: res.ok ? fb.score : 50 };
        }),
      );
      await buildReport(scored);
    } catch (e: any) {
      setError(e.message ?? "Could not build report");
      setPhase("chat");
    }
  }

  /* ----------------------------- Report ----------------------------- */

  async function buildReport(scoredTurns: Turn[]) {
    setPhase("loading");
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, seniority, interviewType, turns: scoredTurns }),
      });
      const data: ReportResponse = await res.json();
      if (!res.ok) throw new Error((data as any).error || "Report failed");
      setReport(data);
      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        role,
        seniority,
        interviewType,
        overallScore: data.overallScore,
        report: data,
      };
      await persistSession(entry, user);
      setHistory(await fetchHistory(user));
      setPhase("report");
    } catch (e: any) {
      setError(e.message ?? "Report failed");
      setPhase(mode === "conversation" ? "chat" : "session");
    }
  }

  function reset() {
    setPhase("setup");
    setReport(null);
    setFeedback(null);
    setAnswer("");
    setTurns([]);
    setIdx(0);
    setMessages([]);
    setChatInput("");
  }

  /* ----------------------------- RENDER ----------------------------- */

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
      <div className="min-w-0">
        {aiConfigured === false && phase !== "setup" && (
          <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-200">
            Demo mode — no AI key detected. Add a <code className="font-mono">GEMINI_API_KEY</code> to{" "}
            <code className="font-mono">.env</code> and restart the server for live AI.
          </div>
        )}
        {aiConfigured && demoMode && phase !== "setup" && (
          <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs text-slate-400">
            Heads up — a response used the offline engine (likely a brief free-tier rate limit). Live AI
            will resume on the next request.
          </div>
        )}
        {error && (
          <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">
            {error}
          </div>
        )}

        {phase === "setup" && (
          <SetupView
            {...{
              role, setRole, seniority, setSeniority, interviewType, setInterviewType,
              jobDescription, setJobDescription, count, setCount, mode, setMode,
              cvAnalysis, cvLoading, cvName, analyzeCv, startInterview,
            }}
          />
        )}

        {phase === "loading" && <LoadingView />}

        {phase === "session" && questions.length > 0 && (
          <SessionView
            question={questions[idx]}
            idx={idx}
            total={questions.length}
            progress={progress}
            answer={answer}
            setAnswer={setAnswer}
            feedback={feedback}
            evaluating={evaluating}
            submitAnswer={submitAnswer}
            nextQuestion={nextQuestion}
            speech={speech}
            isLast={idx + 1 >= questions.length}
          />
        )}

        {phase === "chat" && (
          <ChatView
            messages={messages}
            chatInput={chatInput}
            setChatInput={setChatInput}
            chatLoading={chatLoading}
            sendChat={sendChat}
            finishConversation={finishConversation}
            speech={speech}
            meta={{ role, seniority, interviewType }}
          />
        )}

        {phase === "report" && report && (
          <ReportView report={report} role={role} seniority={seniority} interviewType={interviewType} reset={reset} />
        )}
      </div>

      <HistorySidebar
        history={history}
        signedIn={Boolean(user)}
        onClear={() => {
          clearHistory();
          setHistory([]);
        }}
      />
    </div>
  );
}

/* ============================ SUB-VIEWS ============================ */

function SetupView(p: any) {
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
            {SeniorityLevels.map((s: Seniority) => (
              <button key={s} onClick={() => p.setSeniority(s)} className={`chip ${p.seniority === s ? "chip-on" : "chip-off"}`}>
                {SENIORITY_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Interview type</label>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {InterviewTypes.map((t: InterviewType) => (
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
          {p.cvAnalysis && <CvAnalysisCard analysis={p.cvAnalysis} />}
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

const LOADING_STEPS = [
  "Reviewing the role and level…",
  "Thinking like an interviewer…",
  "Calibrating difficulty…",
  "Putting it together…",
];

function LoadingView() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % LOADING_STEPS.length), 1400);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="glass grid min-h-[320px] place-items-center p-10 text-center">
      <div>
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-brand-400" />
        <p className="mt-5 text-sm text-slate-300 transition-opacity">{LOADING_STEPS[i]}</p>
        <p className="mt-1 text-xs text-slate-500">This usually takes a few seconds.</p>
      </div>
    </div>
  );
}

function SessionView(p: {
  question: Question; idx: number; total: number; progress: number;
  answer: string; setAnswer: (s: string) => void; feedback: Feedback | null;
  evaluating: boolean; submitAnswer: () => void; nextQuestion: () => void;
  speech: { supported: boolean; listening: boolean; start: () => void; stop: () => void };
  isLast: boolean;
}) {
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

function FeedbackCard({ feedback, onNext, isLast }: { feedback: Feedback; onNext: () => void; isLast: boolean }) {
  const star = feedback.star;
  return (
    <div className="glass animate-fade-up p-6 sm:p-7">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <ScoreRing score={feedback.score} label="score" />
        <div className="flex-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-accent-400">Coach feedback</div>
          <p className="mt-1.5 text-lg font-medium leading-snug">{feedback.verdict}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["situation", "task", "action", "result"] as const).map((k) => (
              <span key={k} className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize ${star[k] ? "bg-accent-500/20 text-accent-400" : "bg-white/5 text-slate-500"}`}>
                {star[k] ? "✓" : "○"} {k}
              </span>
            ))}
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

function ChatView(p: {
  messages: ChatMessage[];
  chatInput: string;
  setChatInput: (s: string) => void;
  chatLoading: boolean;
  sendChat: () => void;
  finishConversation: () => void;
  speech: { supported: boolean; listening: boolean; start: () => void; stop: () => void };
  meta: { role: string; seniority: Seniority; interviewType: InterviewType };
}) {
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

function ReportView({
  report, role, seniority, interviewType, reset,
}: {
  report: ReportResponse; role: string; seniority: Seniority; interviewType: InterviewType; reset: () => void;
}) {
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

function HistorySidebar({ history, signedIn, onClear }: { history: HistoryEntry[]; signedIn: boolean; onClear: () => void }) {
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
