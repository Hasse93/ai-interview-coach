/** Extract plain text from an uploaded CV (PDF, or plain-text formats). */
export async function extractCvText(file: File): Promise<string> {
  const name = (file.name || "").toLowerCase();
  const buf = Buffer.from(await file.arrayBuffer());

  if (name.endsWith(".pdf")) {
    // Imported lazily (and from the lib entrypoint) to keep pdf-parse out of
    // the bundle until a PDF is actually uploaded.
    const mod: any = await import("pdf-parse/lib/pdf-parse.js");
    const pdf = mod.default ?? mod;
    const data = await pdf(buf);
    return normalize(data.text ?? "");
  }

  // .txt / .md / unknown → treat as UTF-8 text.
  return normalize(buf.toString("utf-8"));
}

function normalize(text: string): string {
  return text.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
