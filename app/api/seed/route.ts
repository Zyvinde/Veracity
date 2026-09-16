import { NextRequest, NextResponse } from 'next/server';
import { getDb, seedDatabase, getAllPatientsDb } from '@/lib/db';

const ADMIN_TOKEN = process.env.ADMIN_API_KEY;

export async function POST(req: NextRequest) {
  if (ADMIN_TOKEN) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized: provide Authorization: Bearer <ADMIN_API_KEY>' }, { status: 401 });
    }
  }
  try {
    const db = getDb();
    if (!db) {
      return NextResponse.json({ success: true, message: 'Running in-memory mode; seed is already pre-loaded from mock data', count: getAllPatientsDb().length });
    }
    seedDatabase(db);
    const patients = getAllPatientsDb();
    return NextResponse.json({ success: true, message: 'Database re-seeded successfully', count: patients.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}