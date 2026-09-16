import crypto from 'crypto';

/**
 * Initiates GitHub OAuth Flow
 * GET /api/auth/github
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const cleanClientId = (clientId || '').replace(/^["']|["']$/g, '').trim();

  const proto = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const configuredBaseUrl = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  const baseUrl = configuredBaseUrl || `${proto}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/github/callback`;

  // Generate random CSRF protection state
  const state = crypto.randomBytes(16).toString('hex');
  const isProd = process.env.NODE_ENV === 'production';
  const stateCookie = `gh_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${isProd ? '; Secure' : ''}`;

  // Allow explicit dev simulation if requested or if credentials are not configured
  const devSimulate = req.query.simulate === 'true' || req.query.dev === 'true';

  if (!cleanClientId) {
    if (devSimulate) {
      res.setHeader('Set-Cookie', stateCookie);
      return res.redirect(302, `/api/auth/github/callback?code=mock_dev_code_${Date.now()}&state=${state}`);
    }
    return res.redirect(302, `/login?error=github_not_configured`);
  }

  if (devSimulate) {
    res.setHeader('Set-Cookie', stateCookie);
    return res.redirect(302, `/api/auth/github/callback?code=mock_dev_code_${Date.now()}&state=${state}`);
  }

  // Set CSRF state cookie and redirect to GitHub OAuth
  res.setHeader('Set-Cookie', stateCookie);

  const scope = req.query.minimal === 'true' ? 'user:email' : 'read:user user:email';

  const params = new URLSearchParams({
    client_id: cleanClientId,
    redirect_uri: redirectUri,
    scope,
    state
  });

  return res.redirect(302, `https://github.com/login/oauth/authorize?${params.toString()}`);
}
