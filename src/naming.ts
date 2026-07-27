import type { SessionType } from './types';

export function sanitizeIdentifier(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '');
}

export function dateOnly(isoTimestamp: string): string {
  return isoTimestamp.slice(0, 10);
}

export function photoFilename(identifier: string, categoryKey: string, shotNumber: number): string {
  return `${sanitizeIdentifier(identifier)}_${categoryKey}_${shotNumber}.jpg`;
}

export function zipFilename(identifier: string, sessionType: SessionType, createdAt: string): string {
  return `${sanitizeIdentifier(identifier)}_${sessionType}_${dateOnly(createdAt)}.zip`;
}
