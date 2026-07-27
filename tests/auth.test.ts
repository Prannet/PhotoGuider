import { describe, it, expect, vi, beforeEach } from 'vitest';

const loginPopupMock = vi.fn();
const acquireTokenSilentMock = vi.fn();
const getAllAccountsMock = vi.fn();
const initializeMock = vi.fn();

vi.mock('@azure/msal-browser', () => {
  return {
    PublicClientApplication: vi.fn().mockImplementation(() => ({
      loginPopup: loginPopupMock,
      acquireTokenSilent: acquireTokenSilentMock,
      getAllAccounts: getAllAccountsMock,
      initialize: initializeMock,
    })),
  };
});

beforeEach(() => {
  vi.resetModules();
  loginPopupMock.mockReset();
  acquireTokenSilentMock.mockReset();
  getAllAccountsMock.mockReset();
  initializeMock.mockReset();
  initializeMock.mockResolvedValue(undefined);
});

describe('getAccessToken', () => {
  it('logs in via popup when no account is signed in yet', async () => {
    getAllAccountsMock.mockReturnValue([]);
    loginPopupMock.mockResolvedValue({ accessToken: 'token-from-login' });

    const { getAccessToken } = await import('../src/upload/auth');
    const token = await getAccessToken();

    expect(token).toBe('token-from-login');
    expect(loginPopupMock).toHaveBeenCalledWith({ scopes: ['Sites.ReadWrite.All'] });
  });

  it('uses a silent token when an account is already signed in', async () => {
    getAllAccountsMock.mockReturnValue([{ username: 'coworker@company.com' }]);
    acquireTokenSilentMock.mockResolvedValue({ accessToken: 'token-from-silent' });

    const { getAccessToken } = await import('../src/upload/auth');
    const token = await getAccessToken();

    expect(token).toBe('token-from-silent');
    expect(loginPopupMock).not.toHaveBeenCalled();
  });

  it('falls back to popup login when the silent token acquisition fails', async () => {
    getAllAccountsMock.mockReturnValue([{ username: 'coworker@company.com' }]);
    acquireTokenSilentMock.mockRejectedValue(new Error('interaction required'));
    loginPopupMock.mockResolvedValue({ accessToken: 'token-from-fallback' });

    const { getAccessToken } = await import('../src/upload/auth');
    const token = await getAccessToken();

    expect(token).toBe('token-from-fallback');
  });
});
