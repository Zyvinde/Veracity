import { NextRequest, NextResponse } from 'next/server';
import { getAllAttestationsDb, saveAttestationDb } from '@/lib/db';
import { AttestationRecord } from '@/lib/types';

export async function GET() {
  try {
    const attestations = getAllAttestationsDb();
    return NextResponse.json({ success: true, attestations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const record = (await req.json()) as AttestationRecord;
    if (!record || !record.patientId || !record.signatureHash) {
      return NextResponse.json({ success: false, error: 'Invalid attestation record' }, { status: 400 });
    }

    saveAttestationDb(record);
    return NextResponse.json({ success: true, attestation: record });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
