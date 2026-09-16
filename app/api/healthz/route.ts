import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { RULES_ENGINE_VERSION } from '@/lib/constants';

export async function GET() {
  const db = getDb();
  const isDbReady = db !== null;
  return NextResponse.json({
    ok: true,
    status: 'healthy',
    db: isDbReady ? 'sqlite' : 'memory',
    version: RULES_ENGINE_VERSION,
    timestamp: new Date().toISOString(),
  });
}