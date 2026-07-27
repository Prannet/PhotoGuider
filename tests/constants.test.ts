import { describe, it, expect } from 'vitest';
import { categoriesFor } from '../src/constants';

describe('categoriesFor', () => {
  it('returns vehicle categories including tire, interior, and speedometer', () => {
    const categories = categoriesFor('vehicle');
    const keys = categories.map((c) => c.key);
    expect(keys).toEqual([
      'front',
      'leftSide',
      'rightSide',
      'back',
      'tire',
      'interior',
      'speedometer',
      'damages',
      'additional',
    ]);
    expect(categories.filter((c) => c.required)).toHaveLength(7);
  });

  it('returns other-item categories with detail instead of vehicle-specific angles', () => {
    const categories = categoriesFor('other');
    const keys = categories.map((c) => c.key);
    expect(keys).toEqual(['front', 'leftSide', 'rightSide', 'back', 'detail', 'damages', 'additional']);
    expect(categories.filter((c) => c.required)).toHaveLength(5);
  });

  it('marks damages and additional as optional and note-taking', () => {
    const categories = categoriesFor('vehicle');
    const damages = categories.find((c) => c.key === 'damages')!;
    const additional = categories.find((c) => c.key === 'additional')!;
    expect(damages.required).toBe(false);
    expect(damages.allowNotes).toBe(true);
    expect(additional.required).toBe(false);
    expect(additional.allowNotes).toBe(true);
  });
});
