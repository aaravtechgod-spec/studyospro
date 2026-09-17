/**
 * Client-side text extraction for flashcard/AI source material.
 * Supports PDF (via pdf.js) and plain-text-ish files.
 */

export const MAX_SOURCE_CHARS = 60000;

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return extractPdfText(file);
  }

  if (
    file.type.startsWith("text/") ||
    /\.(txt|md|markdown|csv|json|rtf)$/.test(name)
  ) {
    const text = await file.text();
    return text.slice(0, MAX_SOURCE_CHARS);
  }

  throw new Error("Unsupported file. Upload a PDF or a text/markdown file.");
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Vite-friendly worker resolution.
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  const chunks: string[] = [];
  let chars = 0;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (pageText) {
      chunks.push(pageText);
      chars += pageText.length;
    }
    if (chars > MAX_SOURCE_CHARS) break;
  }

  const text = chunks.join("\n\n").slice(0, MAX_SOURCE_CHARS);
  if (!text.trim()) {
    throw new Error("No selectable text in that PDF — it may be a scan of images.");
  }
  return text;
}
