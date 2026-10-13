import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import {
  exchangeCodeForTokens,
  refreshAccessToken,
  saveSession,
  loadSession,
  clearSession,
  isTokenExpired,
  revokeToken,
  useGoogleAuth,
} from './authService';
import { getUserInfo } from '../google-drive/driveApi';
import { AuthSession as AuthSessionType } from '../../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  session: AuthSessionType | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  getValidToken: () => Promise<string>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface StoredSessionFull {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  userInfo?: AuthSessionType['userInfo'];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSessionFull | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { request, response, promptAsync, redirectUri } = useGoogleAuth();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load session on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await loadSession();
        if (stored) {
          if (isTokenExpired(stored.expiresAt) && stored.refreshToken) {
            try {
              const refreshed = await refreshAccessToken(stored.refreshToken);
              const updated: StoredSessionFull = {
                ...stored,
                accessToken: refreshed.accessToken,
                expiresAt: Date.now() + refreshed.expiresIn * 1000,
              };
              await saveSession(updated);
              setSession(updated);
              scheduleRefresh(updated);
            } catch {
              await clearSession();
            }
          } else if (!isTokenExpired(stored.expiresAt)) {
            setSession(stored);
            scheduleRefresh(stored);
          } else {
            await clearSession();
          }
        }
      } finally {
        setIsLoading(false);
      }
    })();
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success' && request) {
      (async () => {
        try {
          setIsLoading(true);
          setError(null);
          const { code } = response.params;
          const codeVerifier = request.codeVerifier ?? '';
          const { accessToken, refreshToken, expiresIn } = await exchangeCodeForTokens(
            code,
            codeVerifier,
            redirectUri
          );
          const userInfo = await getUserInfo(accessToken);
          const newSession: StoredSessionFull = {
            accessToken,
            refreshToken,
            expiresAt: Date.now() + expiresIn * 1000,
            userInfo,
          };
          await saveSession(newSession);
          setSession(newSession);
          scheduleRefresh(newSession);
        } catch (e: any) {
          setError(e.message ?? 'Authentication failed.');
        } finally {
          setIsLoading(false);
        }
      })();
    } else if (response?.type === 'error') {
      setError(response.error?.message ?? 'Authentication failed.');
      setIsLoading(false);
    }
  }, [response]);

  function scheduleRefresh(s: StoredSessionFull) {
    if (!s.refreshToken) return;
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    const delay = s.expiresAt - Date.now() - 5 * 60 * 1000; // 5 min before expiry
    if (delay <= 0) return;
    refreshTimerRef.current = setTimeout(async () => {
      try {
        const refreshed = await refreshAccessToken(s.refreshToken!);
        const updated: StoredSessionFull = {
          ...s,
          accessToken: refreshed.accessToken,
          expiresAt: Date.now() + refreshed.expiresIn * 1000,
        };
        await saveSession(updated);
        setSession(updated);
        scheduleRefresh(updated);
      } catch {
        setSession(null);
        await clearSession();
      }
    }, delay);
  }

  const signIn = useCallback(async () => {
    setError(null);
    if (!request) return;
    await promptAsync();
  }, [request, promptAsync]);

  const signOut = useCallback(async () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    if (session?.accessToken) {
      try { await revokeToken(session.accessToken); } catch {}
    }
    await clearSession();
    setSession(null);
  }, [session]);

  const getValidToken = useCallback(async (): Promise<string> => {
    if (!session) throw new Error('Not authenticated.');
    if (!isTokenExpired(session.expiresAt)) {
      return session.accessToken;
    }
    if (session.refreshToken) {
      const refreshed = await refreshAccessToken(session.refreshToken);
      const updated: StoredSessionFull = {
        ...session,
        accessToken: refreshed.accessToken,
        expiresAt: Date.now() + refreshed.expiresIn * 1000,
      };
      await saveSession(updated);
      setSession(updated);
      scheduleRefresh(updated);
      return updated.accessToken;
    }
    throw new Error('Session expired. Please sign in again.');
  }, [session]);

  const contextValue: AuthContextType = {
    isAuthenticated: !!session && !isTokenExpired(session.expiresAt),
    isLoading,
    session: session
      ? {
          accessToken: session.accessToken,
          expiresAt: session.expiresAt,
          userInfo: session.userInfo,
        }
      : null,
    signIn,
    signOut,
    getValidToken,
    error,
  };

  return React.createElement(AuthContext.Provider, { value: contextValue }, children);
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
