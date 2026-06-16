import { z } from "zod";

export const InterviewTypes = ["behavioral", "technical", "system-design"] as const;
export type InterviewType = (typeof InterviewTypes)[number];

export const SeniorityLevels = ["junior", "mid", "senior", "staff"] as const;
export type Seniority = (typeof SeniorityLevels)[number];

/** Setup payload sent to the question generator. */
export const SetupSchema = z.object({
  role: z.string().min(2).max(120),
  seniority: z.enum(SeniorityLevels),
  interviewType: z.enum(InterviewTypes),
  jobDescription: z.string().max(5000).optional().default(""),
  cvText: z.string().max(15000).optional().default(""),
  count: z.number().int().min(1).max(8).optional().default(5),
});
export type Setup = z.infer<typeof SetupSchema>;

export const QuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  rationale: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

export const QuestionsResponseSchema = z.object({
  questions: z.array(QuestionSchema),
  demoMode: z.boolean(),
});
export type QuestionsResponse = z.infer<typeof QuestionsResponseSchema>;

/** Evaluate payload for a single answer. */
export const EvaluateSchema = z.object({
  role: z.string().min(2).max(120),
  seniority: z.enum(SeniorityLevels),
  interviewType: z.enum(InterviewTypes),
  question: z.string().min(2),
  answer: z.string().min(1).max(8000),
});
export type EvaluateInput = z.infer<typeof EvaluateSchema>;

export const FeedbackSchema = z.object({
  score: z.number().int().min(0).max(100),
  verdict: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  star: z.object({
    situation: z.boolean(),
    task: z.boolean(),
    action: z.boolean(),
    result: z.boolean(),
  }),
  modelAnswer: z.string(),
  followUp: z.string(),
  demoMode: z.boolean(),
});
export type Feedback = z.infer<typeof FeedbackSchema>;

/* ----------------------------- Auth ----------------------------- */

export const SignupSchema = z.object({
  name: z.string().min(1).max(80).optional().default(""),
  email: z.string().email().max(160),
  password: z.string().min(8).max(200),
});
export type SignupInput = z.infer<typeof SignupSchema>;

/** Payload for persisting a finished interview report to the DB. */
export const SaveSessionSchema = z.object({
  role: z.string().min(2).max(120),
  seniority: z.enum(SeniorityLevels),
  interviewType: z.enum(InterviewTypes),
  overallScore: z.number().int().min(0).max(100),
  report: z.any(),
});
export type SaveSessionInput = z.infer<typeof SaveSessionSchema>;

/* ----------------------------- CV analysis ----------------------------- */

export const CvAnalysisSchema = z.object({
  summary: z.string(),
  fitScore: z.number().int().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  focusAreas: z.array(z.string()),
});
export type CvAnalysis = z.infer<typeof CvAnalysisSchema>;

export const CvResponseSchema = z.object({
  analysis: CvAnalysisSchema,
  cvText: z.string(),
  demoMode: z.boolean(),
});
export type CvResponse = z.infer<typeof CvResponseSchema>;

/* ----------------------------- Conversation ----------------------------- */

export const ChatMessageSchema = z.object({
  role: z.enum(["interviewer", "candidate"]),
  content: z.string().min(1).max(8000),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatRequestSchema = z.object({
  role: z.string().min(2).max(120),
  seniority: z.enum(SeniorityLevels),
  interviewType: z.enum(InterviewTypes),
  cvText: z.string().max(15000).optional().default(""),
  messages: z.array(ChatMessageSchema).max(40),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/** A completed turn used to build the session report. */
export const TurnSchema = z.object({
  question: z.string(),
  answer: z.string(),
  score: z.number().int().min(0).max(100),
});
export type Turn = z.infer<typeof TurnSchema>;

export const ReportSchema = z.object({
  role: z.string().min(2).max(120),
  seniority: z.enum(SeniorityLevels),
  interviewType: z.enum(InterviewTypes),
  turns: z.array(TurnSchema).min(1),
});
export type ReportInput = z.infer<typeof ReportSchema>;

export const ReportResponseSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  summary: z.string(),
  dimensions: z.array(
    z.object({ name: z.string(), score: z.number().int().min(0).max(100) }),
  ),
  actionItems: z.array(z.string()),
  demoMode: z.boolean(),
});
export type ReportResponse = z.infer<typeof ReportResponseSchema>;
