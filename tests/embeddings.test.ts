import { describe, expect, it } from "vitest";
import { cosineSimilarity, trySemanticScore } from "@/lib/embeddings";

describe("cosineSimilarity", () => {
  it("returns 1 for identical vectors", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });

  it("returns 0 for orthogonal vectors", () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });

  it("returns -1 for opposite vectors", () => {
    expect(cosineSimilarity([1, 1], [-1, -1])).toBeCloseTo(-1, 5);
  });

  it("is scale-invariant", () => {
    expect(cosineSimilarity([2, 4], [1, 2])).toBeCloseTo(1, 5);
  });

  it("returns 0 when a vector is all zeros", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });
});

describe("trySemanticScore", () => {
  it("returns null for empty input without loading the model", async () => {
    expect(await trySemanticScore("", "anything")).toBeNull();
    expect(await trySemanticScore("anything", "")).toBeNull();
  });
});
