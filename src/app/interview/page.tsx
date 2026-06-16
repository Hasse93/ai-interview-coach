"use client";

import { useEffect, useRef, useState } from "react";
import { useSpeech } from "@/lib/useSpeech";
import { clearHistory, type HistoryEntry } from "@/lib/storage";
import { fetchHistory, persistSession } from "@/lib/history";
import { useUser } from "@/lib/useUser";
import {
  type ChatMessage,
  type CvAnalysis,
  type Feedback,
  type InterviewType,
  type Question,
  type ReportResponse,
  type Seniority,
  type Turn,
} from "@/lib/types";
import { SetupView } from "@/components/interview/SetupView";
import { LoadingView } from "@/components/interview/LoadingView";
import { SessionView } from "@/components/interview/SessionView";
import { ChatView } from "@/components/interview/ChatView";
import { ReportView } from "@/components/interview/ReportView";
import { HistorySidebar } from "@/components/interview/HistorySidebar";
import type { Mode } from "@/components/interview/meta";

type Phase = "setup" | "loading" | "session" | "chat" | "report";

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
  const [cvSemanticFit, setCvSemanticFit] = useState<number | null>(null);
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
      setCvSemanticFit(typeof data.semanticFit === "number" ? data.semanticFit : null);
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
              cvAnalysis, cvSemanticFit, cvLoading, cvName, analyzeCv, startInterview,
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
