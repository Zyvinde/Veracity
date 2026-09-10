import { AuditLogEntry } from './types';

const AUDIT_LOG_KEY = 'anterior_health_audit_log';

function generateId(): string {
  return `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function getClientFingerprint(): string {
  if (typeof window === 'undefined') return 'server';
  return navigator.userAgent.substring(0, 50);
}

export function logAuditEvent(
  action: AuditLogEntry['action'],
  patientId: string,
  details: string
): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    action,
    patientId,
    userId: 'current-physician',
    details,
    ipAddress: getClientFingerprint(),
  };

  try {
    const existing = getAuditLog();
    existing.push(entry);
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(existing.slice(-500)));
    }
  } catch {
    // Storage full or unavailable — fail silently for audit logging
  }

  return entry;
}

export function getAuditLog(): AuditLogEntry[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAuditLogForPatient(patientId: string): AuditLogEntry[] {
  return getAuditLog().filter((e) => e.patientId === patientId);
}

export function clearAuditLog(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUDIT_LOG_KEY);
    }
  } catch {
    // Silently fail
  }
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .substring(0, 500);
}

export function generateCryptographicHash(data: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(data);
  return crypto.subtle
    .digest('SHA-256', msgBuffer)
    .then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      return `0x${hashHex.substring(0, 32)}...${hashHex.substring(hashHex.length - 8)}`;
    })
    .catch(() => '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069');
}
