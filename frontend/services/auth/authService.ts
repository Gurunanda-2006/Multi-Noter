import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthSession as AuthSessionType } from '../../types';

WebBrowser.maybeCompleteAuthSession();

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
];

const SECURE_STORE_KEY = 'psh_auth_session';
const DISCOVERY_URL = 'https://accounts.google.com';

const DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

function getClientId(): string {
  if (Platform.OS === 'android') {
    return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID ?? '';
  }
  if (Platform.OS === 'ios') {
    return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS ?? '';
  }
  // web
  return process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB ?? '';
}

export function useGoogleAuth() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'personalstoragehub',
    path: 'auth',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: getClientId(),
      scopes: SCOPES,
      redirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
    },
    DISCOVERY
  );

  return { request, response, promptAsync, redirectUri };
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string,
  redirectUri: string
): Promise<{ accessToken: string; refreshToken?: string; expiresIn: number }> {
  const clientId = getClientId();

  // For web: proxy through our backend to keep client_secret hidden
  if (Platform.OS === 'web') {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code, codeVerifier, redirectUri }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Token exchange failed: ${err}`);
    }
    const data = await res.json() as { accessToken: string; expiresIn: number };
    return { accessToken: data.accessToken, expiresIn: data.expiresIn };
  }

  // For mobile: client-side PKCE flow (public client, no secret)
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    code_verifier: codeVerifier,
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  const data = await res.json() as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

// Refresh access token using refresh token (mobile only)
export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  if (Platform.OS === 'web') {
    // On web, call backend to refresh
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to refresh token.');
    const data = await res.json() as { accessToken: string; expiresIn: number };
    return data;
  }

  const clientId = getClientId();
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    grant_type: 'refresh_token',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) throw new Error('Token refresh failed.');
  const data = await res.json() as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

// ---------- Secure Storage ----------

interface StoredSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userInfo?: AuthSessionType['userInfo'];
}

export async function saveSession(session: StoredSession): Promise<void> {
  const json = JSON.stringify(session);
  if (Platform.OS !== 'web') {
    await SecureStore.setItemAsync(SECURE_STORE_KEY, json);
  } else {
    // On web: store non-sensitive expiry/userInfo locally; token is in HttpOnly cookie
    // We only persist userInfo + expiresAt for UI display
    const safeData = { expiresAt: session.expiresAt, userInfo: session.userInfo };
    sessionStorage.setItem(SECURE_STORE_KEY, JSON.stringify(safeData));
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    if (Platform.OS !== 'web') {
      const json = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!json) return null;
      return JSON.parse(json) as StoredSession;
    } else {
      // For web: ask backend if session is active
      const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/session`, {
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json() as { accessToken: string; expiresAt: number; userInfo?: AuthSessionType['userInfo'] };
      return { accessToken: data.accessToken, expiresAt: data.expiresAt, userInfo: data.userInfo };
    }
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  if (Platform.OS !== 'web') {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
  } else {
    sessionStorage.removeItem(SECURE_STORE_KEY);
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';
    await fetch(`${apiUrl}/auth/logout`, { method: 'POST', credentials: 'include' });
  }
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 60_000; // 1 min buffer
}

export async function revokeToken(token: string): Promise<void> {
  await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
    method: 'POST',
  });
}
