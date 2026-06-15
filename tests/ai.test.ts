import { describe, expect, it } from "vitest";
import { parseJson, hasApiKey } from "@/lib/ai";

describe("parseJson", () => {
  it("parses clean JSON", () => {
    expect(parseJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it("strips ```json fences", () => {
    const raw = "```json\n{\"x\": true}\n```";
    expect(parseJson<{ x: boolean }>(raw)).toEqual({ x: true });
  });

  it("recovers JSON wrapped in prose", () => {
    const raw = 'Here you go: {"score": 80, "ok": true} hope that helps!';
    expect(parseJson<{ score: number }>(raw).score).toBe(80);
  });

  it("parses arrays", () => {
    expect(parseJson<number[]>("[1,2,3]")).toEqual([1, 2, 3]);
  });

  it("throws on non-JSON", () => {
    expect(() => parseJson("no json here")).toThrow();
  });
});

describe("hasApiKey", () => {
  it("is false when env is empty", () => {
    const prev = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    expect(hasApiKey()).toBe(false);
    if (prev) process.env.ANTHROPIC_API_KEY = prev;
  });
});
