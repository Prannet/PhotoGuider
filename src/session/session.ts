import type { Session, SessionType, IdentifierType, Photo } from '../types';
import { categoriesFor } from '../constants';
import { generateId } from '../id';

export function createSession(sessionType: SessionType, identifierType: IdentifierType, identifier: string): Session {
  return {
    id: generateId(),
    sessionType,
    identifierType,
    identifier,
    createdAt: new Date().toISOString(),
    photos: [],
    status: 'in-progress',
  };
}

export function nextShotNumber(session: Session, categoryKey: string): number {
  return session.photos.filter((p) => p.categoryKey === categoryKey).length + 1;
}

export function addPhoto(session: Session, categoryKey: string, blob: Blob, note?: string): Session {
  const photo: Photo = {
    id: generateId(),
    categoryKey,
    shotNumber: nextShotNumber(session, categoryKey),
    blob,
    note,
    takenAt: new Date().toISOString(),
  };
  return { ...session, photos: [...session.photos, photo] };
}

export function photoCountFor(session: Session, categoryKey: string): number {
  return session.photos.filter((p) => p.categoryKey === categoryKey).length;
}

export function requiredCategoriesComplete(session: Session): boolean {
  return categoriesFor(session.sessionType)
    .filter((c) => c.required)
    .every((c) => photoCountFor(session, c.key) > 0);
}
