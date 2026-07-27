import { describe, it, expect } from 'vitest';
import { sanitizeIdentifier, dateOnly, photoFilename, zipFilename } from '../src/naming';

describe('sanitizeIdentifier', () => {
  it('strips spaces', () => {
    expect(sanitizeIdentifier('11802 ')).toBe('11802');
  });

  it('strips dashes and other punctuation', () => {
    expect(sanitizeIdentifier('LOT-A22')).toBe('LOTA22');
  });

  it('preserves alphanumeric characters and case as typed', () => {
    expect(sanitizeIdentifier('Lot A22')).toBe('LotA22');
  });
});

describe('dateOnly', () => {
  it('extracts the date portion of an ISO timestamp', () => {
    expect(dateOnly('2026-07-27T14:03:00.000Z')).toBe('2026-07-27');
  });
});

describe('photoFilename', () => {
  it('builds Identifier_category_shotNumber.jpg', () => {
    expect(photoFilename('11802', 'leftSide', 1)).toBe('11802_leftSide_1.jpg');
    expect(photoFilename('11802', 'leftSide', 2)).toBe('11802_leftSide_2.jpg');
  });

  it('sanitizes the identifier before building the filename', () => {
    expect(photoFilename('LOT-A22', 'damages', 1)).toBe('LOTA22_damages_1.jpg');
  });
});

describe('zipFilename', () => {
  it('builds Identifier_sessionType_date.zip', () => {
    expect(zipFilename('11802', 'vehicle', '2026-07-27T14:03:00.000Z')).toBe('11802_vehicle_2026-07-27.zip');
  });
});
