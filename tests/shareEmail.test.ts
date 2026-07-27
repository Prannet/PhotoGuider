import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { canShareFiles, shareZipViaEmail } from '../src/upload/shareEmail';

function fakeZipBlob(): Blob {
  return new Blob(['fake-zip-bytes'], { type: 'application/zip' });
}

describe('canShareFiles', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is false when navigator.canShare is unavailable', () => {
    expect(canShareFiles([new File(['a'], 'a.zip')])).toBe(false);
  });

  it('reflects navigator.canShare when available', () => {
    vi.stubGlobal('navigator', { canShare: () => true, share: vi.fn() });
    expect(canShareFiles([new File(['a'], 'a.zip')])).toBe(true);
  });
});

describe('shareZipViaEmail', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('shares the zip as a file via navigator.share', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { canShare: () => true, share: shareMock });

    await shareZipViaEmail('11802_vehicle_2026-07-27.zip', fakeZipBlob());

    expect(shareMock).toHaveBeenCalledTimes(1);
    const call = shareMock.mock.calls[0][0];
    expect(call.files).toHaveLength(1);
    expect(call.files[0].name).toBe('11802_vehicle_2026-07-27.zip');
  });

  it('throws SHARE_NOT_SUPPORTED when file sharing is unavailable', async () => {
    vi.stubGlobal('navigator', {});

    await expect(shareZipViaEmail('11802_vehicle_2026-07-27.zip', fakeZipBlob())).rejects.toThrow(
      'SHARE_NOT_SUPPORTED'
    );
  });

  it('propagates rejection when the user cancels the share sheet', async () => {
    const shareMock = vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError'));
    vi.stubGlobal('navigator', { canShare: () => true, share: shareMock });

    await expect(shareZipViaEmail('11802_vehicle_2026-07-27.zip', fakeZipBlob())).rejects.toThrow();
  });
});
