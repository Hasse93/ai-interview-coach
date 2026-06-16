import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

export type Provider = "gemini" | "anthropic" | "none";

/**
 * Provider resolution order: Gemini is primary, Anthropic is the fallback,
 * and "none" triggers the deterministic demo engine. Switch providers purely
 * by which API key is present in the environment.
 */
export function activeProvider(): Provider {
  if (process.env.GEMINI_API_KEY?.trim()) return "gemini";
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  return "none";
}

export function hasApiKey(): boolean {
  return activeProvider() !== "none";
}

/**
 * Extract a JSON object/array from a model response, tolerating markdown
 * fences or stray prose around it. Throws if nothing parseable is found.
 */
export function parseJson<T>(raw: string): T {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const start = cleaned.search(/[{[]/);
    const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
    throw new Error("Model did not return valid JSON");
  }
}

type CompleteOpts = { json?: boolean; maxTokens?: number };

/** Call the active provider and return the model's text output. */
export async function complete(prompt: string, opts: CompleteOpts = {}): Promise<string> {
  const provider = activeProvider();
  if (provider === "gemini") return completeGemini(prompt, opts);
  if (provider === "anthropic") return completeAnthropic(prompt, opts);
  throw new Error("No AI provider configured");
}

async function completeGemini(prompt: string, opts: CompleteOpts): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
  const res = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      maxOutputTokens: opts.maxTokens ?? 2048,
      // 2.5-flash "thinks" by default, eating the token budget before it
      // emits the answer. We don't need reasoning for these structured tasks,
      // so disable it — keeps the full budget for the actual JSON output.
      thinkingConfig: { thinkingBudget: 0 },
      // Native JSON mode makes structured responses reliable.
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  });
  return res.text ?? "";
}

/**
 * Stream the active provider's text output chunk by chunk. Falls back to a
 * single full chunk for providers without streaming, and throws for "none"
 * so the caller can serve its deterministic fallback.
 */
export async function* completeStream(
  prompt: string,
  opts: CompleteOpts = {},
): AsyncGenerator<string> {
  const provider = activeProvider();
  if (provider === "gemini") {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
    const stream = await ai.models.generateContentStream({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { maxOutputTokens: opts.maxTokens ?? 800, thinkingConfig: { thinkingBudget: 0 } },
    });
    for await (const chunk of stream) {
      if (chunk.text) yield chunk.text;
    }
    return;
  }
  if (provider === "anthropic") {
    // Single chunk — keeps the streaming interface without provider-specific code.
    yield await completeAnthropic(prompt, opts);
    return;
  }
  throw new Error("No AI provider configured");
}

async function completeAnthropic(prompt: string, opts: CompleteOpts): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const msg = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: opts.maxTokens ?? 1400,
    messages: [{ role: "user", content: prompt }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}
