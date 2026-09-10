import { NextRequest, NextResponse } from 'next/server';
import { getPatientByIdDb, savePatientDb } from '@/lib/db';
import { PatientCase } from '@/lib/types';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  try {
    const patient = (await req.json()) as PatientCase;
    patient.id = params.id;
    savePatientDb(patient);
    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
