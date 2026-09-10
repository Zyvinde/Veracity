import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogsDb, saveAuditLogDb } from '@/lib/db';
import { AuditLogEntry } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId') || undefined;
    const logs = getAuditLogsDb(patientId);
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const entry = (await req.json()) as AuditLogEntry;
    if (!entry || !entry.id || !entry.action) {
      return NextResponse.json({ success: false, error: 'Invalid audit log entry' }, { status: 400 });
    }

    saveAuditLogDb(entry);
    return NextResponse.json({ success: true, log: entry });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
