import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PatientCase, AttestationRecord, AuditLogEntry } from './types';

export function authEnforced(): boolean {
  // MVP default: enforce auth unless explicitly disabled for local demo.
  // Set AUTH_ENFORCED=false only for local evaluation.
  if (process.env.AUTH_ENFORCED === 'false') return false;
  return true;
}

export async function requireAuth() {
  if (!authEnforced()) return null;
  // Lazy import avoids pulling next-auth config (and @ alias) into unit tests / edge bundles.
  const { authOptions } = await import('./auth');
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
  if (
    !requireString(p.id) ||
    !requireString(p.mrn) ||
    !requireString(p.name) ||
    !Number.isFinite(p.age) ||
    (p.gender !== 'M' && p.gender !== 'F')
  ) return false;
  // Bound nested payloads to prevent oversized/forged records via PUT.
  if (p.id.length > 64 || p.mrn.length > 64 || p.name.length > 120) return false;
  if (p.age < 0 || p.age > 120) return false;
  if (Array.isArray((p as any).labs) && (p as any).labs.length > 100) return false;
  if (Array.isArray((p as any).medications) && (p as any).medications.length > 50) return false;
  return true;
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
  if (!requireString(a.id) || !requireString(a.action) || !requireString(a.patientId) || !requireString(a.userId)) return false;
  if (a.id.length > 64 || a.patientId.length > 64 || a.userId.length > 64) return false;
  if (typeof (a as any).details === 'string' && (a as any).details.length > 2000) return false;
  return true;
}

export function sanitizeFilename(name: string): string {
  return name
    .split(/[\\/]/).pop()!
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 120) || 'upload';
}