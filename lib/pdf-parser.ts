import { BoundingBox } from './types';

export interface ExtractedLine {
  text: string;
  bbox: BoundingBox;
  page: number;
}

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
  lines: ExtractedLine[];
}

export interface ExtractedDocumentResult {
  fullText: string;
  pages: ExtractedPageText[];
  isOcr: boolean;
  filename?: string;
}

/**
 * Server-safe loader for pdfjs-dist
 */
async function getPdfJs() {
  if (typeof window === 'undefined') {
    // Node.js server environment
    // eslint-disable-next-line
    const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
    return pdfjs;
  } else {
    // Browser environment
    const pdfjs = await import('pdfjs-dist');
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version || '3.11.174'}/pdf.worker.min.js`;
    }
    return pdfjs;
  }
}

/**
 * Extracts structured text and bounding boxes from a PDF buffer (Uint8Array or ArrayBuffer).
 */
export async function extractTextFromPdfBuffer(
  buffer: ArrayBuffer | Uint8Array,
  filename?: string
): Promise<ExtractedDocumentResult> {
  const pdfjs = await getPdfJs();
  const data = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  const loadingTask = pdfjs.getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  });

  const doc = await loadingTask.promise;
  const pages: ExtractedPageText[] = [];
  let fullText = '';

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    // Group text items into lines based on vertical proximity (Y coordinate)
    interface RawItem {
      str: string;
      x: number;
      y: number; // In PDF coordinates (0,0 is bottom-left)
      width: number;
      height: number;
    }

    const rawItems: RawItem[] = [];
    for (const item of textContent.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const tx = item.transform[4];
      const ty = item.transform[5];
      const width = item.width || 10;
      const height = item.height || Math.abs(item.transform[0]) || 10;
      rawItems.push({
        str: item.str,
        x: tx,
        y: ty,
        width,
        height,
      });
    }

    // Sort items top-to-bottom (descending PDF Y), then left-to-right (ascending X)
    rawItems.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 4) return yDiff;
      return a.x - b.x;
    });

    // Bucket into line rows
    const lines: ExtractedLine[] = [];
    let currentLineItems: RawItem[] = [];
    let currentLineY: number | null = null;

    const flushLine = () => {
      if (currentLineItems.length === 0) return;
      // Sort left to right
      currentLineItems.sort((a, b) => a.x - b.x);
      const lineText = currentLineItems.map((i) => i.str).join(' ').trim();
      if (!lineText) return;

      const minX = Math.min(...currentLineItems.map((i) => i.x));
      const maxX = Math.max(...currentLineItems.map((i) => i.x + i.width));
      const minY = Math.min(...currentLineItems.map((i) => i.y));
      const maxY = Math.max(...currentLineItems.map((i) => i.y + i.height));

      // Convert PDF coordinates (0,0 bottom-left) to normalized [0..1] top-left coords
      // ymin in screen coords corresponds to maxY in PDF coords
      const xmin = Math.max(0, Math.min(1, minX / viewport.width));
      const xmax = Math.max(0, Math.min(1, maxX / viewport.width));
      const ymin = Math.max(0, Math.min(1, (viewport.height - maxY) / viewport.height));
      const ymax = Math.max(0, Math.min(1, (viewport.height - minY) / viewport.height));

      lines.push({
        text: lineText,
        page: pageNum,
        bbox: {
          ymin: parseFloat(ymin.toFixed(4)),
          xmin: parseFloat(xmin.toFixed(4)),
          ymax: parseFloat(ymax.toFixed(4)),
          xmax: parseFloat(xmax.toFixed(4)),
        },
      });
      currentLineItems = [];
    };

    for (const item of rawItems) {
      if (currentLineY === null) {
        currentLineY = item.y;
        currentLineItems.push(item);
      } else if (Math.abs(currentLineY - item.y) <= 5) {
        currentLineItems.push(item);
      } else {
        flushLine();
        currentLineY = item.y;
        currentLineItems.push(item);
      }
    }
    flushLine();

    const pageFullText = lines.map((l) => l.text).join('\n');
    pages.push({
      pageNumber: pageNum,
      text: pageFullText,
      lines,
    });
    fullText += (fullText ? '\n\n' : '') + pageFullText;
  }

  // If text is virtually empty, it might be a scanned image PDF
  const isOcrNeeded = fullText.trim().length < 40;

  return {
    fullText,
    pages,
    isOcr: isOcrNeeded,
    filename,
  };
}

/**
 * Client-side OCR fallback using tesseract.js for scanned images or image-only documents
 */
export async function performClientOcr(imageSource: string | Blob | File): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  const ret = await worker.recognize(imageSource);
  await worker.terminate();
  return ret.data.text;
}

/**
 * Client-side PDF file extractor
 */
export async function extractTextFromPdfFileClient(file: File): Promise<ExtractedDocumentResult> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await extractTextFromPdfBuffer(arrayBuffer, file.name);

  // If it's an image file (.png, .jpg, .jpeg) or scanned PDF with zero text, run Tesseract OCR
  if (file.type.startsWith('image/') || result.isOcr) {
    try {
      const ocrText = await performClientOcr(file);
      if (ocrText && ocrText.trim().length > 0) {
        const ocrLines = ocrText.split('\n').filter((l) => l.trim());
        const lines: ExtractedLine[] = ocrLines.map((line, idx) => ({
          text: line.trim(),
          page: 1,
          bbox: {
            ymin: parseFloat((idx / Math.max(1, ocrLines.length)).toFixed(4)),
            xmin: 0.1,
            ymax: parseFloat(((idx + 1) / Math.max(1, ocrLines.length)).toFixed(4)),
            xmax: 0.9,
          },
        }));

        return {
          fullText: ocrText,
          pages: [
            {
              pageNumber: 1,
              text: ocrText,
              lines,
            },
          ],
          isOcr: true,
          filename: file.name,
        };
      }
    } catch (err) {
      console.warn('Tesseract OCR fallback failed or skipped:', err);
    }
  }

  return result;
}
