import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPdfBuffer } from '@/lib/pdf-parser';
import { parseLabReport } from '@/lib/lab-parser';
import { saveUploadedFileDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const labSource = (formData.get('source') as string) || 'GENERIC';
    const patientAge = formData.get('age') ? parseInt(formData.get('age') as string, 10) : undefined;
    const patientGender = (formData.get('gender') as 'M' | 'F') || undefined;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
    }

    const filename = file.name;
    const mimeType = file.type || 'application/pdf';
    const rawCategory = (formData.get('category') as string) || 'OTHER';
    const category = (['LAB', 'ECG', 'ECHO', 'CONSENT', 'OTHER'] as const).includes(rawCategory as any)
      ? (rawCategory as 'LAB' | 'ECG' | 'ECHO' | 'CONSENT' | 'OTHER')
      : 'OTHER';
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Save uploaded file into SQLite for persistence
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const base64Data = Buffer.from(uint8Array).toString('base64');
    try {
      saveUploadedFileDb(fileId, filename, mimeType, base64Data, category);
    } catch (dbErr) {
      console.warn('File DB save skipped or failed:', dbErr);
    }

    // Extract text and bounding boxes from PDF
    const extractionResult = await extractTextFromPdfBuffer(uint8Array, filename);

    // Flatten lines for lab parsing
    const allLines = extractionResult.pages.flatMap((p) => p.lines);

    // Parse structured lab items from extracted text
    const parsedLabs = parseLabReport(
      extractionResult.fullText,
      labSource as any,
      allLines,
      filename,
      { age: patientAge, gender: patientGender }
    );

    return NextResponse.json({
      success: true,
      fileId,
      filename,
      category,
      fullText: extractionResult.fullText,
      pages: extractionResult.pages,
      isOcr: extractionResult.isOcr,
      parsedLabs,
      dataUrl: `data:${mimeType};base64,${base64Data}`,
    });
  } catch (error: any) {
    console.error('Error in /api/extract:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to extract PDF text' },
      { status: 500 }
    );
  }
}
