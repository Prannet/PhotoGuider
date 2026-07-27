import JSZip from 'jszip';
import type { Session } from '../types';
import { photoFilename } from '../naming';

export function buildMetadata(session: Session) {
  return {
    identifier: session.identifier,
    identifierType: session.identifierType,
    sessionType: session.sessionType,
    createdAt: session.createdAt,
    photos: session.photos.map((p) => ({
      filename: photoFilename(session.identifier, p.categoryKey, p.shotNumber),
      category: p.categoryKey,
      shotNumber: p.shotNumber,
      takenAt: p.takenAt,
      note: p.note ?? null,
    })),
  };
}

export async function buildSessionZip(session: Session): Promise<Blob> {
  const zip = new JSZip();
  for (const photo of session.photos) {
    zip.file(photoFilename(session.identifier, photo.categoryKey, photo.shotNumber), photo.blob);
  }
  zip.file('metadata.json', JSON.stringify(buildMetadata(session), null, 2));
  return zip.generateAsync({ type: 'blob' });
}
