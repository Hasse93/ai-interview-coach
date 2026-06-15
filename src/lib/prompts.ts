import type { EvaluateInput, ReportInput, Setup } from "./types";

const TYPE_LABEL: Record<string, string> = {
  behavioral: "behavioral (focus on past experience, ownership, collaboration, conflict, the STAR method)",
  technical: "technical (focus on hands-on knowledge, problem solving, trade-offs, code/architecture reasoning)",
  "system-design": "system design (focus on requirements, scale, data modeling, bottlenecks, trade-offs)",
};

export function questionsPrompt(setup: Setup): string {
  const jd = setup.jobDescription?.trim()
    ? `\n\nTailor the questions to this job description:\n"""\n${setup.jobDescription.trim()}\n"""`
    : "";
  return [
    `You are a senior interviewer hiring a ${setup.seniority} ${setup.role}.`,
    `Generate exactly ${setup.count} ${TYPE_LABEL[setup.interviewType]} interview questions.`,
    `Each question must be realistic, specific, and progressively harder.`,
    jd,
    `\nReturn ONLY valid JSON of the shape:`,
    `{"questions":[{"id":"q1","prompt":"...","rationale":"what the interviewer is assessing"}]}`,
    `Do not include markdown fences or any prose outside the JSON.`,
  ].join("\n");
}

export function evaluatePrompt(input: EvaluateInput): string {
  return [
    `You are an expert interview coach evaluating a candidate for a ${input.seniority} ${input.role} role.`,
    `Interview type: ${input.interviewType}.`,
    `\nQuestion:\n${input.question}`,
    `\nCandidate answer:\n${input.answer}`,
    `\nEvaluate the answer honestly and constructively. Return ONLY valid JSON:`,
    `{`,
    `  "score": <0-100 integer>,`,
    `  "verdict": "<one-sentence overall judgment>",`,
    `  "strengths": ["..."],`,
    `  "improvements": ["..."],`,
    `  "star": {"situation": <bool>, "task": <bool>, "action": <bool>, "result": <bool>},`,
    `  "modelAnswer": "<a concise, strong example answer>",`,
    `  "followUp": "<a natural follow-up question an interviewer would ask next>"`,
    `}`,
    `For non-behavioral questions still set star flags based on structure/clarity. No markdown, JSON only.`,
  ].join("\n");
}

export function reportPrompt(input: ReportInput): string {
  const lines = input.turns
    .map((t, i) => `Q${i + 1} (scored ${t.score}): ${t.question}\nA: ${t.answer}`)
    .join("\n\n");
  return [
    `You are an interview coach writing a final report for a ${input.seniority} ${input.role} (${input.interviewType}) mock interview.`,
    `\nTranscript:\n${lines}`,
    `\nReturn ONLY valid JSON:`,
    `{`,
    `  "overallScore": <0-100 integer>,`,
    `  "summary": "<2-3 sentence overall assessment>",`,
    `  "dimensions": [{"name":"Communication","score":<0-100>}, {"name":"Depth","score":<0-100>}, {"name":"Structure","score":<0-100>}, {"name":"Impact","score":<0-100>}],`,
    `  "actionItems": ["<prioritized, specific improvement>"]`,
    `}`,
    `No markdown, JSON only.`,
  ].join("\n");
}
