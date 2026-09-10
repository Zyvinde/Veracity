import { NextResponse } from 'next/server';
import { getDb, seedDatabase, getAllPatientsDb } from '@/lib/db';

export async function POST() {
  try {
    const db = getDb();
    seedDatabase(db);
    const patients = getAllPatientsDb();
    return NextResponse.json({ success: true, message: 'Database re-seeded successfully', count: patients.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
