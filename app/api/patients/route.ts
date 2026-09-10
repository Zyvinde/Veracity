import { NextRequest, NextResponse } from 'next/server';
import { getAllPatientsDb, savePatientDb } from '@/lib/db';
import { PatientCase } from '@/lib/types';

export async function GET() {
  try {
    const patients = getAllPatientsDb();
    return NextResponse.json({ success: true, patients });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const patient = (await req.json()) as PatientCase;
    if (!patient || !patient.id || !patient.name) {
      return NextResponse.json({ success: false, error: 'Invalid patient data' }, { status: 400 });
    }

    savePatientDb(patient);
    return NextResponse.json({ success: true, patient });
  } catch (error: any) {
    console.error('Error saving patient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
