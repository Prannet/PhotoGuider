import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { createSession, addPhoto } from '../src/session/session';
import { buildSessionZip, buildMetadata } from '../src/zip/buildZip';

function fakeBlob(content: string): Blob {
  return new Blob([content], { type: 'image/jpeg' });
}

describe('buildMetadata', () => {
  it('includes identifier, session type, and per-photo details', () => {
    let session = createSession('vehicle', 'unit', '11802');
    session = addPhoto(session, 'front', fakeBlob('a'));
    session = addPhoto(session, 'damages', fakeBlob('b'), 'scratch on bumper');

    const metadata = buildMetadata(session);
    expect(metadata.identifier).toBe('11802');
    expect(metadata.sessionType).toBe('vehicle');
    expect(metadata.photos).toHaveLength(2);
    expect(metadata.photos[0].filename).toBe('11802_front_1.jpg');
    expect(metadata.photos[1].filename).toBe('11802_damages_1.jpg');
    expect(metadata.photos[1].note).toBe('scratch on bumper');
    expect(metadata.photos[0].note).toBeNull();
  });
});

describe('buildSessionZip', () => {
  it('produces a zip containing one file per photo plus metadata.json', async () => {
    let session = createSession('vehicle', 'unit', '11802');
    session = addPhoto(session, 'front', fakeBlob('a'));
    session = addPhoto(session, 'leftSide', fakeBlob('b'));
    session = addPhoto(session, 'leftSide', fakeBlob('c'));

    const zipBlob = await buildSessionZip(session);
    const zip = await JSZip.loadAsync(zipBlob);
    const filenames = Object.keys(zip.files).sort();

    expect(filenames).toEqual(['11802_front_1.jpg', '11802_leftSide_1.jpg', '11802_leftSide_2.jpg', 'metadata.json']);

    const metadataText = await zip.files['metadata.json'].async('string');
    const metadata = JSON.parse(metadataText);
    expect(metadata.photos).toHaveLength(3);
  });
});
