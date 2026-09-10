import path from 'path';
import fs from 'fs';
import { PatientCase, AttestationRecord, AuditLogEntry } from './types';
import { MOCK_PATIENT_LIST } from './mock-data';

// Determine safe storage path across local Windows / macOS / Linux and Vercel serverless (/tmp)
const IS_VERCEL = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);
const DATA_DIR = IS_VERCEL ? path.join('/tmp', 'anterior-data') : path.join(process.cwd(), 'data');

try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  // If filesystem is strictly read-only, we fallback gracefully
}

const DB_PATH = path.join(DATA_DIR, 'anterior.db');

let dbInstance: any = null;
let useMemoryFallback = false;

// Resilient in-memory storage fallback for Vercel / serverless edge
const inMemoryStore = {
  patients: new Map<string, PatientCase>(MOCK_PATIENT_LIST.map((p) => [p.id, p])),
  attestations: new Map<string, AttestationRecord>(),
  auditLogs: [] as AuditLogEntry[],
  uploadedFiles: new Map<string, { filename: string; mimeType: string; dataBase64: string }>(),
};

export function getDb(): any {
  if (useMemoryFallback) return null;
  if (!dbInstance) {
    try {
      // eslint-disable-next-line
      const Database = require('better-sqlite3');
      dbInstance = new Database(DB_PATH);
      dbInstance.pragma('journal_mode = WAL');
      initTables(dbInstance);
    } catch (err) {
      console.warn('SQLite native initialization failed or running in serverless; switching to in-memory store:', err);
      useMemoryFallback = true;
      return null;
    }
  }
  return dbInstance;
}

function initTables(db: any) {
  try {
    // Patients table
    db.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        mrn TEXT NOT NULL,
        name TEXT NOT NULL,
        age INTEGER NOT NULL,
        gender TEXT NOT NULL,
        overall_status TEXT NOT NULL,
        procedure_name TEXT NOT NULL,
        data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Attestations table
    db.exec(`
      CREATE TABLE IF NOT EXISTS attestations (
        patient_id TEXT PRIMARY KEY,
        anesthesiologist_name TEXT NOT NULL,
        license_number TEXT NOT NULL,
        signature_hash TEXT NOT NULL,
        timestamp_iso TEXT NOT NULL,
        data JSON NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Audit logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        action TEXT NOT NULL,
        patient_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        details TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Uploaded files table
    db.exec(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        data_base64 TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM patients');
    const count = (countStmt.get() as { count: number }).count;
    if (count === 0) {
      seedDatabase(db);
    }
  } catch (err) {
    console.warn('Table initialization failed, using memory fallback:', err);
    useMemoryFallback = true;
  }
}

export function seedDatabase(db: any) {
  try {
    const insertPatient = db.prepare(`
      INSERT OR REPLACE INTO patients (id, mrn, name, age, gender, overall_status, procedure_name, data)
      VALUES (@id, @mrn, @name, @age, @gender, @overall_status, @procedure_name, @data)
    `);

    for (const patient of MOCK_PATIENT_LIST) {
      insertPatient.run({
        id: patient.id,
        mrn: patient.mrn,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        overall_status: patient.overallStatus,
        procedure_name: patient.procedureName,
        data: JSON.stringify(patient),
      });
    }
  } catch (err) {
    console.warn('Seeding failed, using memory store:', err);
  }
}

// Database helper functions with automatic memory fallback
export function getAllPatientsDb(): PatientCase[] {
  const db = getDb();
  if (!db) {
    return Array.from(inMemoryStore.patients.values());
  }
  try {
    const rows = db.prepare('SELECT data FROM patients ORDER BY updated_at DESC').all() as { data: string }[];
    return rows.map((r) => JSON.parse(r.data));
  } catch (e) {
    return Array.from(inMemoryStore.patients.values());
  }
}

export function getPatientByIdDb(id: string): PatientCase | null {
  const db = getDb();
  if (!db) {
    return inMemoryStore.patients.get(id) || null;
  }
  try {
    const row = db.prepare('SELECT data FROM patients WHERE id = ?').get(id) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : null;
  } catch (e) {
    return inMemoryStore.patients.get(id) || null;
  }
}

export function savePatientDb(patient: PatientCase): void {
  inMemoryStore.patients.set(patient.id, patient);
  const db = getDb();
  if (!db) return;
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO patients (id, mrn, name, age, gender, overall_status, procedure_name, data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(
      patient.id,
      patient.mrn,
      patient.name,
      patient.age,
      patient.gender,
      patient.overallStatus,
      patient.procedureName,
      JSON.stringify(patient)
    );
  } catch (e) {
    // Memory store already updated
  }
}

export function getAllAttestationsDb(): Record<string, AttestationRecord> {
  const db = getDb();
  if (!db) {
    const map: Record<string, AttestationRecord> = {};
    inMemoryStore.attestations.forEach((val, key) => {
      map[key] = val;
    });
    return map;
  }
  try {
    const rows = db.prepare('SELECT patient_id, data FROM attestations').all() as { patient_id: string; data: string }[];
    const map: Record<string, AttestationRecord> = {};
    for (const row of rows) {
      map[row.patient_id] = JSON.parse(row.data);
    }
    return map;
  } catch (e) {
    const map: Record<string, AttestationRecord> = {};
    inMemoryStore.attestations.forEach((val, key) => {
      map[key] = val;
    });
    return map;
  }
}

export function saveAttestationDb(record: AttestationRecord): void {
  inMemoryStore.attestations.set(record.patientId, record);
  const db = getDb();
  if (!db) return;
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO attestations (patient_id, anesthesiologist_name, license_number, signature_hash, timestamp_iso, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      record.patientId,
      record.anesthesiologistName,
      record.licenseNumber,
      record.signatureHash,
      record.timestampIso,
      JSON.stringify(record)
    );
  } catch (e) {
    // Memory store already updated
  }
}

export function getAuditLogsDb(patientId?: string): AuditLogEntry[] {
  const db = getDb();
  if (!db) {
    if (patientId) {
      return inMemoryStore.auditLogs.filter((l) => l.patientId === patientId);
    }
    return inMemoryStore.auditLogs.slice(-100);
  }
  try {
    if (patientId) {
      const rows = db.prepare('SELECT id, timestamp, action, patient_id as patientId, user_id as userId, details FROM audit_logs WHERE patient_id = ? ORDER BY created_at DESC').all(patientId) as AuditLogEntry[];
      return rows;
    }
    const rows = db.prepare('SELECT id, timestamp, action, patient_id as patientId, user_id as userId, details FROM audit_logs ORDER BY created_at DESC LIMIT 100').all() as AuditLogEntry[];
    return rows;
  } catch (e) {
    return inMemoryStore.auditLogs.slice(-100);
  }
}

export function saveAuditLogDb(entry: AuditLogEntry): void {
  inMemoryStore.auditLogs.unshift(entry);
  const db = getDb();
  if (!db) return;
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, timestamp, action, patient_id, user_id, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      entry.id,
      entry.timestamp,
      entry.action,
      entry.patientId,
      entry.userId,
      entry.details
    );
  } catch (e) {
    // Memory store updated
  }
}

export function saveUploadedFileDb(id: string, filename: string, mimeType: string, base64: string): void {
  inMemoryStore.uploadedFiles.set(id, { filename, mimeType, dataBase64: base64 });
  const db = getDb();
  if (!db) return;
  try {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO uploaded_files (id, filename, mime_type, data_base64)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, filename, mimeType, base64);
  } catch (e) {
    // Memory store updated
  }
}

export function getUploadedFileDb(id: string): { filename: string; mimeType: string; dataBase64: string } | null {
  const db = getDb();
  if (!db) {
    return inMemoryStore.uploadedFiles.get(id) || null;
  }
  try {
    const row = db.prepare('SELECT filename, mime_type as mimeType, data_base64 as dataBase64 FROM uploaded_files WHERE id = ?').get(id) as { filename: string; mimeType: string; dataBase64: string } | undefined;
    return row || inMemoryStore.uploadedFiles.get(id) || null;
  } catch (e) {
    return inMemoryStore.uploadedFiles.get(id) || null;
  }
}
