import { Router, Request, Response } from 'express';

// Extend express-session to include our custom fields
declare module 'express-session' {
  interface SessionData {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    userInfo?: {
      email: string;
      name: string;
      picture?: string;
    };
  }
}

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3001/auth/callback';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// Exchange authorization code for tokens
// POST /auth/token
// Body: { code, codeVerifier, redirectUri }
router.post('/token', async (req: Request, res: Response) => {
  try {
    const { code, codeVerifier, redirectUri } = req.body as {
      code: string;
      codeVerifier: string;
      redirectUri: string;
    };

    if (!code || !redirectUri) {
      res.status(400).json({ error: 'Missing code or redirectUri' });
      return;
    }

    const body = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    });

    const tokenData = await fetchJson<{
      access_token: string;
      refresh_token?: string;
      expires_in: number;
    }>('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    // Fetch user info
    const userInfo = await fetchJson<{ email: string; name: string; picture?: string }>(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    // Store tokens in server-side session (not sent to client)
    req.session.accessToken = tokenData.access_token;
    req.session.refreshToken = tokenData.refresh_token;
    req.session.expiresAt = Date.now() + tokenData.expires_in * 1000;
    req.session.userInfo = userInfo;

    // Only send non-sensitive info to client
    res.json({
      accessToken: tokenData.access_token, // sent once so client can make Drive calls directly
      expiresIn: tokenData.expires_in,
      userInfo,
    });
  } catch (err: any) {
    console.error('Token exchange error:', err);
    res.status(500).json({ error: err.message ?? 'Token exchange failed' });
  }
});

// Get current session info (validates session cookie)
// GET /auth/session
router.get('/session', (req: Request, res: Response) => {
  if (!req.session.accessToken || !req.session.expiresAt) {
    res.status(401).json({ error: 'No active session' });
    return;
  }

  // If token expired, try to return what we have and let client decide
  res.json({
    accessToken: req.session.accessToken,
    expiresAt: req.session.expiresAt,
    userInfo: req.session.userInfo,
  });
});

// Refresh token
// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const refreshToken = req.session.refreshToken;
  if (!refreshToken) {
    res.status(401).json({ error: 'No refresh token in session' });
    return;
  }

  try {
    const body = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    });

    const tokenData = await fetchJson<{ access_token: string; expires_in: number }>(
      'https://oauth2.googleapis.com/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      }
    );

    req.session.accessToken = tokenData.access_token;
    req.session.expiresAt = Date.now() + tokenData.expires_in * 1000;

    res.json({
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
    });
  } catch (err: any) {
    console.error('Token refresh error:', err);
    res.status(500).json({ error: err.message ?? 'Token refresh failed' });
  }
});

// Logout / destroy session
// POST /auth/logout
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to destroy session' });
      return;
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

export { router as authRouter };
