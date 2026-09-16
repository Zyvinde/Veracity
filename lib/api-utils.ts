import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PatientCase, AttestationRecord, AuditLogEntry } from '@/lib/types';

export function authEnforced(): boolean {
  return process.env.AUTH_ENFORCED === 'true';
}

export async function requireAuth() {
  if (!authEnforced()) return null;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export const ALLOWED_UPLOAD_CATEGORIES = ['LAB', 'ECG', 'ECHO', 'CONSENT', 'OTHER'] as const;
export type UploadCategory = (typeof ALLOWED_UPLOAD_CATEGORIES)[number];

export function assertUploadCategory(raw: string | null): UploadCategory {
  if (raw && (ALLOWED_UPLOAD_CATEGORIES as readonly string[]).includes(raw)) {
    return raw as UploadCategory;
  }
  return 'OTHER';
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function requireString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isValidPatientCase(v: unknown): v is PatientCase {
  if (!isObject(v)) return false;
  const p = v as unknown as PatientCase;
  return (
    requireString(p.id) &&
    requireString(p.mrn) &&
    requireString(p.name) &&
    Number.isFinite(p.age) &&
    (p.gender === 'M' || p.gender === 'F')
  );
}

export function isValidAttestation(v: unknown): v is AttestationRecord {
  if (!isObject(v)) return false;
  const a = v as unknown as AttestationRecord;
  return (
    requireString(a.patientId) &&
    requireString(a.anesthesiologistName) &&
    requireString(a.licenseNumber) &&
    requireString(a.signatureHash) &&
    requireString(a.timestampIso) &&
    Array.isArray(a.acceptedClauses) &&
    requireString(a.rulesEngineVersion)
  );
}

export function isValidAuditLog(v: unknown): v is AuditLogEntry {
  if (!isObject(v)) return false;
  const a = v as unknown as AuditLogEntry;
  return requireString(a.id) && requireString(a.action) && requireString(a.patientId) && requireString(a.userId);
}