import { PublicClientApplication, type AuthenticationResult } from '@azure/msal-browser';

const GRAPH_SCOPES = ['Sites.ReadWrite.All'];

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID ?? '',
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID ?? 'common'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin : undefined,
  },
};

let msalInstance: PublicClientApplication | null = null;

async function getMsalInstance(): Promise<PublicClientApplication> {
  if (!msalInstance) {
    msalInstance = new PublicClientApplication(msalConfig);
    await msalInstance.initialize();
  }
  return msalInstance;
}

export async function login(): Promise<AuthenticationResult> {
  const instance = await getMsalInstance();
  return instance.loginPopup({ scopes: GRAPH_SCOPES });
}

export async function getAccessToken(): Promise<string> {
  const instance = await getMsalInstance();
  const accounts = instance.getAllAccounts();

  if (accounts.length === 0) {
    const result = await login();
    return result.accessToken;
  }

  try {
    const result = await instance.acquireTokenSilent({ scopes: GRAPH_SCOPES, account: accounts[0] });
    return result.accessToken;
  } catch {
    const result = await login();
    return result.accessToken;
  }
}
