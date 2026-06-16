import type {
  ChatRequest,
  CvAnalysis,
  EvaluateInput,
  Feedback,
  Question,
  ReportInput,
  ReportResponse,
  Setup,
} from "./types";

/**
 * Deterministic, network-free generators used when no ANTHROPIC_API_KEY is
 * configured (demo mode) or when a live call fails. They are intentionally
 * simple but produce coherent, role-aware output so the app always works.
 */

const BANKS: Record<string, string[]> = {
  behavioral: [
    "Tell me about a time you disagreed with a teammate. How did you handle it?",
    "Describe a project you owned end to end. What was the hardest part?",
    "Tell me about a time you failed. What did you learn?",
    "Describe a situation where you had to influence someone without authority.",
    "Tell me about a time you had to deliver under a tight deadline.",
    "Describe feedback that was hard to hear and what you did with it.",
    "Tell me about a time you improved a process for your team.",
    "Describe a conflict with a stakeholder and how you resolved it.",
  ],
  technical: [
    "How would you debug a service that intermittently returns 500 errors in production?",
    "Explain the trade-offs between SQL and NoSQL for a high-write workload.",
    "How do you ensure a function is correct, performant, and maintainable?",
    "Walk me through how you would optimize a slow database query.",
    "Explain how you would design a rate limiter.",
    "What strategies do you use to prevent and detect memory leaks?",
    "How would you make an existing API backward compatible while evolving it?",
    "Describe how you would approach adding caching to a read-heavy endpoint.",
  ],
  "system-design": [
    "Design a URL shortener that handles 10k requests per second.",
    "Design a news feed for a social network with millions of users.",
    "Design a rate limiter for a public API.",
    "Design a notification system supporting email, SMS, and push.",
    "Design a scalable file storage and sharing service.",
    "Design a real-time collaborative document editor.",
    "Design a ride-matching system for a ride-share app.",
    "Design a distributed job scheduler.",
  ],
};

export function fallbackQuestions(setup: Setup): Question[] {
  const bank = BANKS[setup.interviewType] ?? BANKS.behavioral;
  const jdHint = setup.jobDescription?.trim()
    ? " (tailored to the pasted job description)"
    : "";
  return bank.slice(0, setup.count).map((prompt, i) => ({
    id: `q${i + 1}`,
    prompt: prompt.replace(/a service|a function|a project/, (m) => m),
    rationale: `Assessing ${setup.seniority}-level ${setup.role} competency${jdHint}.`,
  }));
}

function detectStar(answer: string) {
  const a = answer.toLowerCase();
  return {
    situation: /\b(when|while|at the time|context|situation|the team|we were)\b/.test(a),
    task: /\b(needed to|had to|my (job|task|goal)|responsible|objective)\b/.test(a),
    action: /\b(i (built|did|implemented|led|created|decided|wrote|designed|migrated|fixed))\b/.test(a),
    result: /\b(result|as a result|improved|reduced|increased|outcome|grew|saved|%|percent)\b/.test(a),
  };
}

export function fallbackEvaluate(input: EvaluateInput): Feedback {
  const words = input.answer.trim().split(/\s+/).filter(Boolean);
  const len = words.length;
  const star = detectStar(input.answer);
  const starHits = Object.values(star).filter(Boolean).length;
  const hasMetric = /\d/.test(input.answer);

  // Heuristic score: length + structure + concreteness, capped sensibly.
  let score = 35;
  score += Math.min(len, 160) / 160 * 30; // up to +30 for substance
  score += starHits * 6; // up to +24 for structure
  score += hasMetric ? 8 : 0; // quantified impact
  score = Math.max(10, Math.min(96, Math.round(score)));

  const strengths: string[] = [];
  if (len >= 60) strengths.push("Answer has enough depth to show real experience.");
  if (star.action) strengths.push("Clearly describes the actions you personally took.");
  if (hasMetric) strengths.push("Backs up impact with concrete numbers.");
  if (strengths.length === 0) strengths.push("You engaged directly with the question.");

  const improvements: string[] = [];
  if (len < 60) improvements.push("Add more detail — aim for a 45–90 second spoken answer.");
  if (!star.result) improvements.push("Close with the measurable result or outcome.");
  if (!hasMetric) improvements.push("Quantify the impact (%, time saved, revenue, users).");
  if (!star.situation) improvements.push("Open by setting the situation and context first.");
  if (improvements.length === 0) improvements.push("Tighten the structure so each sentence earns its place.");

  const followUps: Record<string, string> = {
    behavioral: "What would you do differently if you faced that situation again?",
    technical: "How would your approach change if traffic increased 10x?",
    "system-design": "Where is the first bottleneck, and how would you address it?",
  };

  return {
    score,
    verdict:
      score >= 75
        ? "Strong answer — structured and convincing with minor polish needed."
        : score >= 55
          ? "Solid foundation; tighten the structure and quantify the impact."
          : "A reasonable start, but the answer needs more depth and structure.",
    strengths,
    improvements,
    star,
    modelAnswer:
      input.interviewType === "behavioral"
        ? "Situation: set the context in one line. Task: state your specific responsibility. Action: walk through 2–3 concrete steps you took. Result: end with a quantified outcome and what you learned."
        : "Start by clarifying requirements and constraints, state your approach and key trade-offs, then walk through the solution step by step and finish with how you'd validate and scale it.",
    followUp: followUps[input.interviewType] ?? followUps.behavioral,
    demoMode: true,
  };
}

const CV_SIGNALS: { label: string; re: RegExp }[] = [
  { label: "leadership experience", re: /\b(led|managed|mentored|owned|spearheaded)\b/i },
  { label: "quantified impact", re: /\d+\s?(%|percent|x|k\b|users|ms|hours)/i },
  { label: "modern tech stack", re: /\b(react|node|typescript|python|aws|kubernetes|docker|go|rust|next\.?js)\b/i },
  { label: "testing & quality", re: /\b(test|tdd|ci\/cd|coverage|jest|vitest|pytest)\b/i },
  { label: "scale/architecture", re: /\b(microservice|distributed|scal|architecture|system design)\b/i },
];

export function fallbackCvAnalysis(cvText: string, role: string): CvAnalysis {
  const words = cvText.trim().split(/\s+/).filter(Boolean).length;
  const present = CV_SIGNALS.filter((s) => s.re.test(cvText));
  const missing = CV_SIGNALS.filter((s) => !s.re.test(cvText));

  let score = 40 + present.length * 9 + Math.min(words, 600) / 600 * 14;
  score = Math.max(20, Math.min(94, Math.round(score)));

  const strengths = present.length
    ? present.map((s) => `Demonstrates ${s.label}.`)
    : ["The CV is concise and readable."];
  const weaknesses = missing.length
    ? missing.slice(0, 3).map((s) => `Little evidence of ${s.label} — add concrete examples.`)
    : ["Consider tightening bullet points to lead with impact."];

  return {
    summary: `A ${score >= 70 ? "strong" : score >= 50 ? "promising" : "developing"} profile for a ${role} role. ${present.length} of ${CV_SIGNALS.length} key signals detected. Strengthen the gaps below before interviewing.`,
    fitScore: score,
    strengths,
    weaknesses,
    focusAreas: [
      "Prepare 2-3 STAR stories that quantify your impact.",
      "Be ready to deep-dive on the most recent project on your CV.",
      missing[0] ? `Brush up on ${missing[0].label}.` : "Rehearse explaining trade-offs you made.",
    ],
  };
}

export function fallbackChat(input: ChatRequest): string {
  const bank = BANKS[input.interviewType] ?? BANKS.behavioral;
  const answered = input.messages.filter((m) => m.role === "candidate").length;
  if (answered === 0) {
    return `Hi, thanks for joining today! I'm excited to learn more about your experience as a ${input.role}. Let's start: ${bank[0]}`;
  }
  const reactions = [
    "Thanks, that's a helpful example.",
    "Got it — I appreciate the detail.",
    "Interesting, thanks for walking me through that.",
    "Makes sense. Let's keep going.",
  ];
  const reaction = reactions[answered % reactions.length];
  const q = bank[answered % bank.length];
  return `${reaction} ${q}`;
}

export function fallbackReport(input: ReportInput): ReportResponse {
  const avg = Math.round(
    input.turns.reduce((s, t) => s + t.score, 0) / input.turns.length,
  );
  const jitter = (base: number, d: number) => Math.max(0, Math.min(100, base + d));
  return {
    overallScore: avg,
    summary:
      avg >= 75
        ? "Strong overall performance. You communicate with structure and back claims with evidence. Keep sharpening concision."
        : avg >= 55
          ? "A promising interview. Your fundamentals are there; focus on structure and quantified outcomes to level up."
          : "Good effort with clear room to grow. Prioritize structured answers (STAR) and concrete, measurable results.",
    dimensions: [
      { name: "Communication", score: jitter(avg, 4) },
      { name: "Depth", score: jitter(avg, -3) },
      { name: "Structure", score: jitter(avg, -6) },
      { name: "Impact", score: jitter(avg, 2) },
    ],
    actionItems: [
      "Use the STAR framework for every behavioral answer.",
      "End each answer with a measurable result.",
      "Practice out loud to keep answers under 90 seconds.",
      "Prepare 3 flagship stories you can adapt to many questions.",
    ],
    demoMode: true,
  };
}
