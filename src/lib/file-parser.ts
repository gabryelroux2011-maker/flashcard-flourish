// Helper: parse uploaded files into plain text
// Supports PDF, DOCX, TXT, and images (OCR)
import * as pdfjs from "pdfjs-dist";
// @ts-expect-error - workerSrc exists at runtime
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
}

export async function fileToText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return await pdfToText(file);
  }
  if (
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const buf = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer: buf });
    return result.value;
  }
  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return await file.text();
  }
  if (file.type.startsWith("image/")) {
    return await imageToText(file);
  }
  // fallback: try as text
  try {
    return await file.text();
  } catch {
    throw new Error(`Format non supporté: ${file.name}`);
  }
}

async function pdfToText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let out = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it: any) => it.str).join(" ");
    out += strings + "\n\n";
  }
  return out.trim();
}

async function imageToText(file: File): Promise<string> {
  // Lazy import to avoid heavy startup cost
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("fra+eng");
  const url = URL.createObjectURL(file);
  try {
    const { data } = await worker.recognize(url);
    return data.text;
  } finally {
    URL.revokeObjectURL(url);
    await worker.terminate();
  }
}
