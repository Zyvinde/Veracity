import { describe, expect, it } from 'vitest';
import { isValidPatientCase, isValidAuditLog, sanitizeFilename, authEnforced } from '../lib/api-utils';

describe('MVP hardening', () => {
  it('enforces auth by default, allows explicit local opt-out', () => {
    // Default (no env) must be enforced after hardening
    delete process.env.AUTH_ENFORCED;
    expect(authEnforced()).toBe(true);
    process.env.AUTH_ENFORCED = 'false';
    expect(authEnforced()).toBe(false);
    delete process.env.AUTH_ENFORCED;
  });

  it('rejects oversized/forged patient payloads', () => {
    const base = { id: 'PAT-1', mrn: 'MRN-1', name: 'Test', age: 40, gender: 'M' };
    expect(isValidPatientCase(base)).toBe(true);
    expect(isValidPatientCase({ ...base, id: 'x'.repeat(65) })).toBe(false);
    expect(isValidPatientCase({ ...base, age: 200 })).toBe(false);
    expect(isValidPatientCase({ ...base, labs: new Array(101).fill({}) })).toBe(false);
  });

  it('bounds audit log payloads', () => {
    const base = { id: 'AUD-1', action: 'VIEW', patientId: 'PAT-1', userId: 'demo' };
    expect(isValidAuditLog(base)).toBe(true);
    expect(isValidAuditLog({ ...base, details: 'x'.repeat(2001) })).toBe(false);
  });

  it('sanitizes upload filenames', () => {
    expect(sanitizeFilename('../../etc/passwd.pdf')).toBe('passwd.pdf');
    expect(sanitizeFilename('my lab report (1).pdf')).toContain('my_lab_report');
    expect(sanitizeFilename('')).toBe('upload');
  });
});
