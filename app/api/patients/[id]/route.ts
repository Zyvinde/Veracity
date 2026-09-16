import { NextRequest, NextResponse } from 'next/server';
import { getPatientByIdDb, savePatientDb } from '@/lib/db';
import { PatientCase } from '@/lib/types';
import { requireAuth } from '@/lib/api-utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const patient = getPatientByIdDb(params.id);
    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const existing = getPatientByIdDb(params.id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Patient not found', createHint: 'Use POST /api/patients to create a new patient' },
        { status: 404 }
      );
    }
    const incoming = (await req.json()) as Partial<PatientCase>;
    if (!incoming.name || !incoming.mrn) {
      return NextResponse.json(
        { success: false, error: 'PUT requires at minimum name and mrn' },
        { status: 400 }
      );
    }
    const merged: PatientCase = { ...existing, ...incoming, id: params.id };
    savePatientDb(merged);
    return NextResponse.json({ success: true, patient: merged });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}