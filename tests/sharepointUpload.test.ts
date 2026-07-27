import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/upload/auth', () => ({
  getAccessToken: vi.fn().mockResolvedValue('fake-token'),
}));

import { uploadZipToSharePoint } from '../src/upload/sharepointUpload';

function fakeZipBlob(): Blob {
  return new Blob(['fake-zip-bytes'], { type: 'application/zip' });
}

describe('uploadZipToSharePoint', () => {
  beforeEach(() => {
    // vi.restoreAllMocks() would wipe the mockResolvedValue set inside the vi.mock()
    // factory above (a bare vi.fn() has no "original" implementation to restore to),
    // breaking getAccessToken in the first test. clearAllMocks() only clears call
    // history and preserves the configured mock implementation.
    vi.clearAllMocks();
  });

  it('creates an upload session then PUTs the file to the returned URL', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uploadUrl: 'https://upload.example.com/session-123' }),
      })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);

    await uploadZipToSharePoint('11802_vehicle_2026-07-27.zip', fakeZipBlob());

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [createUrl, createOptions] = fetchMock.mock.calls[0];
    expect(createUrl).toContain('createUploadSession');
    expect(createUrl).toContain('11802_vehicle_2026-07-27.zip');
    expect(createOptions.headers.Authorization).toBe('Bearer fake-token');

    const [uploadUrl, uploadOptions] = fetchMock.mock.calls[1];
    expect(uploadUrl).toBe('https://upload.example.com/session-123');
    expect(uploadOptions.method).toBe('PUT');
    expect(uploadOptions.headers['Content-Range']).toMatch(/^bytes 0-\d+\/\d+$/);
  });

  it('throws when creating the upload session fails', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({ ok: false, status: 403 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadZipToSharePoint('11802_vehicle_2026-07-27.zip', fakeZipBlob())).rejects.toThrow(
      'Failed to create upload session: 403'
    );
  });

  it('throws when the file PUT fails', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ uploadUrl: 'https://upload.example.com/session-123' }) })
      .mockResolvedValueOnce({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);

    await expect(uploadZipToSharePoint('11802_vehicle_2026-07-27.zip', fakeZipBlob())).rejects.toThrow(
      'Upload failed: 500'
    );
  });
});
