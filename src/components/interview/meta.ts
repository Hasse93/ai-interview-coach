import type { InterviewType, Seniority } from "@/lib/types";

/** Shared display metadata + types for the interview UI. */

export type Mode = "structured" | "conversation";

/** Speech-recognition controls returned by useSpeech. */
export type SpeechControls = {
  supported: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
};

export const TYPE_META: Record<InterviewType, { label: string; emoji: string }> = {
  behavioral: { label: "Behavioral", emoji: "💬" },
  technical: { label: "Technical", emoji: "⚙️" },
  "system-design": { label: "System Design", emoji: "🏗️" },
};

export const SENIORITY_LABEL: Record<Seniority, string> = {
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  staff: "Staff+",
};
