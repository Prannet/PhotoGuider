import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Session } from '../types';

interface SentIdentifierRecord {
  key: string;
  date: string;
  identifier: string;
  sentAt: string;
}

interface AppDB extends DBSchema {
  sessions: {
    key: string;
    value: Session;
  };
  sentIdentifiers: {
    key: string;
    value: SentIdentifierRecord;
  };
}

const DB_NAME = 'auction-photo-app';
let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore('sessions', { keyPath: 'id' });
        db.createObjectStore('sentIdentifiers', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

export async function saveSession(session: Session): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getActiveSession(): Promise<Session | undefined> {
  const db = await getDB();
  const all = await db.getAll('sessions');
  return all.find((s) => s.status === 'in-progress');
}

export async function clearSession(sessionId: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', sessionId);
}

export async function wasIdentifierUsedToday(identifier: string, dateStr: string): Promise<boolean> {
  const db = await getDB();
  const record = await db.get('sentIdentifiers', `${dateStr}_${identifier}`);
  return record !== undefined;
}

export async function recordIdentifierSent(identifier: string, dateStr: string): Promise<void> {
  const db = await getDB();
  const key = `${dateStr}_${identifier}`;
  await db.put('sentIdentifiers', { key, date: dateStr, identifier, sentAt: new Date().toISOString() });
}

export async function __resetForTests(): Promise<void> {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
    dbPromise = null;
  }
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => resolve();
  });
}
