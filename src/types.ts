export type SessionType = 'vehicle' | 'other';
export type IdentifierType = 'unit' | 'lot';

export interface Photo {
  id: string;
  categoryKey: string;
  shotNumber: number;
  blob: Blob;
  note?: string;
  takenAt: string;
}

export interface Session {
  id: string;
  sessionType: SessionType;
  identifierType: IdentifierType;
  identifier: string;
  createdAt: string;
  photos: Photo[];
  status: 'in-progress' | 'complete';
}
