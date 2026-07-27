import { describe, it, expect } from 'vitest';
import { createSession, addPhoto, nextShotNumber, photoCountFor, requiredCategoriesComplete } from '../src/session/session';

function fakeBlob(): Blob {
  return new Blob(['fake-image-bytes'], { type: 'image/jpeg' });
}

describe('createSession', () => {
  it('creates an in-progress session with no photos', () => {
    const session = createSession('vehicle', 'unit', '11802');
    expect(session.sessionType).toBe('vehicle');
    expect(session.identifierType).toBe('unit');
    expect(session.identifier).toBe('11802');
    expect(session.status).toBe('in-progress');
    expect(session.photos).toEqual([]);
    expect(session.id).toBeTruthy();
    expect(session.createdAt).toBeTruthy();
  });

  it('gives each session a unique id', () => {
    const a = createSession('vehicle', 'unit', '11802');
    const b = createSession('vehicle', 'unit', '11803');
    expect(a.id).not.toBe(b.id);
  });
});

describe('nextShotNumber and addPhoto', () => {
  it('numbers shots starting at 1 per category, independent of other categories', () => {
    let session = createSession('vehicle', 'unit', '11802');
    expect(nextShotNumber(session, 'front')).toBe(1);

    session = addPhoto(session, 'front', fakeBlob());
    expect(photoCountFor(session, 'front')).toBe(1);
    expect(nextShotNumber(session, 'front')).toBe(2);
    expect(nextShotNumber(session, 'leftSide')).toBe(1);

    session = addPhoto(session, 'front', fakeBlob());
    session = addPhoto(session, 'leftSide', fakeBlob());
    expect(photoCountFor(session, 'front')).toBe(2);
    expect(photoCountFor(session, 'leftSide')).toBe(1);
  });

  it('attaches an optional note to a photo', () => {
    let session = createSession('vehicle', 'unit', '11802');
    session = addPhoto(session, 'damages', fakeBlob(), 'scratch on rear bumper');
    expect(session.photos[0].note).toBe('scratch on rear bumper');
  });
});

describe('requiredCategoriesComplete', () => {
  it('is false until every required vehicle category has a photo', () => {
    let session = createSession('vehicle', 'unit', '11802');
    expect(requiredCategoriesComplete(session)).toBe(false);

    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior']) {
      session = addPhoto(session, key, fakeBlob());
    }
    expect(requiredCategoriesComplete(session)).toBe(false);

    session = addPhoto(session, 'speedometer', fakeBlob());
    expect(requiredCategoriesComplete(session)).toBe(true);
  });

  it('does not require damages or additional', () => {
    let session = createSession('vehicle', 'unit', '11802');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'tire', 'interior', 'speedometer']) {
      session = addPhoto(session, key, fakeBlob());
    }
    expect(requiredCategoriesComplete(session)).toBe(true);
  });

  it('uses the shorter other-item required list', () => {
    let session = createSession('other', 'lot', 'LOTA22');
    for (const key of ['front', 'leftSide', 'rightSide', 'back', 'detail']) {
      session = addPhoto(session, key, fakeBlob());
    }
    expect(requiredCategoriesComplete(session)).toBe(true);
  });
});
