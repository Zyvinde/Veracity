import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogsDb, saveAuditLogDb } from '@/lib/db';
import { requireAuth, isValidAuditLog } from '@/lib/api-utils';

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
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
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    if (!isValidAuditLog(body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid audit log entry: required fields: id, action, patientId, userId' },
        { status: 400 }
      );
    }
    saveAuditLogDb(body);
    return NextResponse.json({ success: true, log: body });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}