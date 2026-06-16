/**
 * Local semantic-similarity model (no API, no cost).
 *
 * Uses a small sentence-embedding transformer (all-MiniLM-L6-v2, 384-dim) run
 * in-process via Transformers.js to turn text into vectors, then compares them
 * with cosine similarity. Powers:
 *   - CV ↔ target-role match score
 *   - candidate answer ↔ question relevance score
 *
 * The model is lazy-loaded once and cached. Every public call degrades
 * gracefully (returns null) if the model can't load, so the app never breaks.
 */

const MODEL = "Xenova/all-MiniLM-L6-v2";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let extractorPromise: Promise<any> | null = null;

async function getExtractor() {
  if (!extractorPromise) {
    const { pipeline, env } = await import("@xenova/transformers");
    // Pull weights from the HF hub/cache rather than expecting local files.
    env.allowLocalModels = false;
    extractorPromise = pipeline("feature-extraction", MODEL);
  }
  return extractorPromise;
}

/** Embed a string into a normalized 384-dim vector. */
async function embed(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text.slice(0, 2000), { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/** Cosine similarity of two equal-length vectors, in [-1, 1]. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Semantic match between two texts as a 0–100 score. */
async function semanticScore(a: string, b: string): Promise<number> {
  const [va, vb] = await Promise.all([embed(a), embed(b)]);
  const sim = cosineSimilarity(va, vb);
  return Math.max(0, Math.min(100, Math.round(sim * 100)));
}

/** Non-throwing variant — returns null if the model is unavailable. */
export async function trySemanticScore(a: string, b: string): Promise<number | null> {
  try {
    if (!a?.trim() || !b?.trim()) return null;
    return await semanticScore(a, b);
  } catch {
    return null;
  }
}
