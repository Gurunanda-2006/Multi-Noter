import { ApiError } from '../types';

export function parseApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    const anyErr = error as any;
    return {
      code: anyErr.status ?? anyErr.code ?? 0,
      message: error.message,
      details: anyErr.details,
    };
  }
  if (typeof error === 'string') {
    return { code: 0, message: error };
  }
  return { code: 0, message: 'An unknown error occurred.' };
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('Network')) return true;
  if (error instanceof Error && (error.message.includes('network') || error.message.includes('fetch'))) return true;
  return false;
}

export function isAuthError(error: unknown): boolean {
  const err = error as any;
  return err?.status === 401 || err?.code === 401 || (err?.message ?? '').includes('401');
}
