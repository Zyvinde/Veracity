import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdfBuffer } from '@/lib/pdf-parser';
import { detectLabSource, parseLabReport } from '@/lib/lab-parser';
import { saveUploadedFileDb } from '@/lib/db';
import { requireAuth, assertUploadCategory, sanitizeFilename } from '@/lib/api-utils';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/tiff',
  'image/heic',
  'image/heif',
]);

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const labSource = (formData.get('source') as string) || 'GENERIC';
    const patientAge = formData.get('age') ? parseInt(formData.get('age') as string, 10) : undefined;
    const patientGender = (formData.get('gender') as 'M' | 'F') || undefined;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { success: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)` },
        { status: 413 }
      );
    }

    const mimeType = file.type || 'application/pdf';
    if (!ALLOWED_TYPES.has(mimeType)) {
      return NextResponse.json(
        { success: false, error: `Unsupported file type: ${mimeType}. Allowed: PDF, PNG, JPEG, WebP, TIFF, HEIC/HEIF` },
        { status: 415 }
      );
    }

    const filename = sanitizeFilename(file.name || 'upload');
    const category = assertUploadCategory(formData.get('category') as string);
    const rawSource = (formData.get('source') as string) || 'AUTO';
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    // MVP demo: keep uploads in local demo store only. Do not upload real PHI here.
    const base64Data = Buffer.from(uint8Array).toString('base64');

    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    try {
      saveUploadedFileDb(fileId, filename, mimeType, base64Data, category);
    } catch (dbErr) {
      console.warn('File DB save skipped or failed:', dbErr);
    }

    const extractionResult = await extractTextFromPdfBuffer(uint8Array, filename);
    const allLines = extractionResult.pages.flatMap((p) => p.lines);

    // Source auto-detect (PureLab/Al Borg/Medsol) when caller sends AUTO or nothing.
    const requestedSource = rawSource === 'AUTO' || !rawSource ? detectLabSource(extractionResult.fullText, filename) : (labSource as any);

    const parsedLabs = parseLabReport(
      extractionResult.fullText,
      requestedSource,
      allLines,
      filename,
      { age: patientAge, gender: patientGender }
    );

    return NextResponse.json({
      success: true,
      fileId,
      filename,
      category,
      source: requestedSource,
      fullText: extractionResult.fullText,
      pages: extractionResult.pages,
      isOcr: extractionResult.isOcr,
      parsedLabs,
      dataUrl: `data:${mimeType};base64,${base64Data}`,
    });
  } catch (error: any) {
    // Avoid echoing untrusted filenames/PHI into logs or responses.
    console.error('Error in /api/extract: upload failed');
    return NextResponse.json(
      { success: false, error: 'Failed to extract document text (MVP demo)' },
      { status: 500 }
    );
  }
}