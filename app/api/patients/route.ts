import { NextRequest, NextResponse } from 'next/server';
import { getAllPatientsDb, savePatientDb } from '@/lib/db';
import { requireAuth, isValidPatientCase } from '@/lib/api-utils';

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const patients = getAllPatientsDb();
    return NextResponse.json({ success: true, patients });
  } catch (error: any) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    if (!isValidPatientCase(body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid patient data: required fields: id, mrn, name, age (number), gender (M|F)' },
        { status: 400 }
      );
    }
    savePatientDb(body);
    return NextResponse.json({ success: true, patient: body });
  } catch (error: any) {
    console.error('Error saving patient:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}