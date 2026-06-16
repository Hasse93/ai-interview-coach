declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfParseResult = { text: string; numpages: number; info: unknown };
  const pdf: (data: Buffer | Uint8Array) => Promise<PdfParseResult>;
  export default pdf;
}
