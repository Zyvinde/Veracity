import { NextRequest, NextResponse } from 'next/server';
import { getAllAttestationsDb, saveAttestationDb } from '@/lib/db';
import { requireAuth, isValidAttestation } from '@/lib/api-utils';

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const attestations = getAllAttestationsDb();
    return NextResponse.json({ success: true, attestations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    if (!isValidAttestation(body)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid attestation: required fields: patientId, anesthesiologistName, licenseNumber, signatureHash, timestampIso, acceptedClauses[], rulesEngineVersion',
        },
        { status: 400 }
      );
    }
    saveAttestationDb(body);
    return NextResponse.json({ success: true, attestation: body });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}