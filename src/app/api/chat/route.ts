import { completeStream, hasApiKey } from "@/lib/ai";
import { fallbackChat } from "@/lib/fallback";
import { chatPrompt } from "@/lib/prompts";
import { rateLimited } from "@/lib/rateLimit";
import { ChatRequestSchema } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = rateLimited(req);
  if (limited) return limited;

  const body = await req.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  const input = parsed.data;
  const encoder = new TextEncoder();
  const demo = !hasApiKey();

  // Demo mode: stream the deterministic reply word-by-word for a live feel.
  if (demo) {
    const text = fallbackChat(input);
    const stream = new ReadableStream({
      async start(controller) {
        for (const word of text.split(" ")) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise((r) => setTimeout(r, 18));
        }
        controller.close();
      },
    });
    return new Response(stream, { headers: streamHeaders(true) });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let any = false;
        for await (const chunk of completeStream(chatPrompt(input), { maxTokens: 500 })) {
          any = true;
          controller.enqueue(encoder.encode(chunk));
        }
        if (!any) controller.enqueue(encoder.encode(fallbackChat(input)));
      } catch {
        // Mid-stream failure (e.g. rate limit) — finish with the offline reply.
        controller.enqueue(encoder.encode(fallbackChat(input)));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: streamHeaders(false) });
}

function streamHeaders(demo: boolean): HeadersInit {
  return {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    "x-demo-mode": String(demo),
  };
}
