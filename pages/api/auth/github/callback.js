import prisma from '../../../../lib/prisma';
import {
  generateAlias,
  createSessionToken,
  parseSession,
  serializeSessionCookie,
  parseCookieHeader
} from '../../../../lib/auth';
import { recordLedgerEntry } from '../../../../lib/ledger';

/**
 * Handles GitHub OAuth Callback
 * GET /api/auth/github/callback
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code, state, error: ghError, error_description } = req.query;

  // Clear state cookie helper
  const isProd = process.env.NODE_ENV === 'production';
  const clearStateCookie = `gh_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isProd ? '; Secure' : ''}`;

  if (ghError) {
    console.error('GitHub OAuth error from provider:', ghError, error_description);
    res.setHeader('Set-Cookie', clearStateCookie);
    return res.redirect(302, `/login?error=${encodeURIComponent(ghError)}`);
  }

  if (!code || !state) {
    res.setHeader('Set-Cookie', clearStateCookie);
    return res.redirect(302, '/login?error=invalid_oauth_request');
  }

  // Validate CSRF state against stored cookie
  const rawCookie = req.headers?.cookie || '';
  const cookies = req.cookies || parseCookieHeader(rawCookie);
  const storedState = cookies['gh_oauth_state'];

  if (!storedState || storedState !== state) {
    console.error('OAuth state mismatch: expected', storedState, 'got', state);
    res.setHeader('Set-Cookie', clearStateCookie);
    return res.redirect(302, '/login?error=state_mismatch');
  }

  try {
    let ghUser = null;
    let userEmail = null;

    // Check if this is a dev/simulation authorization code
    if (typeof code === 'string' && code.startsWith('mock_dev_code_')) {
      const mockId = `mock_${code.slice(-6)}`;
      ghUser = {
        id: 88812345,
        login: `github_dev_${mockId}`,
        name: 'GitHub Developer (Demo)'
      };
      userEmail = `${ghUser.login}@graveyard.local`;
    } else {
      // Live production GitHub OAuth exchange
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        res.setHeader('Set-Cookie', clearStateCookie);
        return res.redirect(302, '/login?error=github_not_configured');
      }

      const proto = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || `${proto}://${host}`;
      const redirectUri = `${baseUrl}/api/auth/github/callback`;

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Digital-Graveyard'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri
        })
      });

      const tokenData = await tokenRes.json();
      if (!tokenData || !tokenData.access_token) {
        console.error('Failed to exchange code for GitHub access token:', tokenData);
        res.setHeader('Set-Cookie', clearStateCookie);
        return res.redirect(302, '/login?error=token_exchange_failed');
      }

      const accessToken = tokenData.access_token;

      // Fetch GitHub User profile
      const profileRes = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Digital-Graveyard'
        }
      });

      if (!profileRes.ok) {
        console.error('Failed to fetch GitHub profile:', profileRes.status);
        res.setHeader('Set-Cookie', clearStateCookie);
        return res.redirect(302, '/login?error=profile_fetch_failed');
      }

      ghUser = await profileRes.json();
      userEmail = ghUser.email;

      // If email is private, query the emails endpoint
      if (!userEmail) {
        try {
          const emailsRes = await fetch('https://api.github.com/user/emails', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Digital-Graveyard'
            }
          });
          if (emailsRes.ok) {
            const emails = await emailsRes.json();
            if (Array.isArray(emails)) {
              const primary = emails.find(e => e.primary && e.verified) || emails.find(e => e.verified) || emails[0];
              if (primary && primary.email) {
                userEmail = primary.email;
              }
            }
          }
        } catch (e) {
          console.warn('Could not retrieve secondary emails from GitHub:', e);
        }
      }

      if (!userEmail) {
        userEmail = `${ghUser.login}@users.noreply.github.com`;
      }
    }

    const cleanEmail = userEmail.toLowerCase();
    const githubIdStr = String(ghUser.id);
    const githubUsernameStr = ghUser.login;

    // Check if an existing session is active (Account Linking flow)
    const activeUserId = parseSession(req);
    if (activeUserId) {
      try {
        await prisma.user.update({
          where: { id: activeUserId },
          data: {
            githubId: githubIdStr,
            githubUsername: githubUsernameStr
          }
        });
        res.setHeader('Set-Cookie', clearStateCookie);
        return res.redirect(302, '/dashboard?tab=anonymity&connected=github');
      } catch (linkErr) {
        console.error('Error linking GitHub account to active session:', linkErr);
        res.setHeader('Set-Cookie', clearStateCookie);
        return res.redirect(302, '/dashboard?tab=anonymity&error=github_already_linked');
      }
    }

    // User is NOT logged in: Locate or create user
    let user = await prisma.user.findUnique({
      where: { githubId: githubIdStr }
    });

    if (user) {
      // User exists by GitHub ID -> update username if changed
      if (user.githubUsername !== githubUsernameStr) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { githubUsername: githubUsernameStr }
        });
      }
    } else {
      // Check if user exists with this email address
      const existingByEmail = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });

      if (existingByEmail) {
        // Link GitHub identity to existing email account
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            githubId: githubIdStr,
            githubUsername: githubUsernameStr
          }
        });
      } else {
        // Register new User with assigned Digger alias
        let alias = generateAlias();
        let aliasExists = await prisma.user.findUnique({ where: { alias } });
        while (aliasExists) {
          alias = generateAlias();
          aliasExists = await prisma.user.findUnique({ where: { alias } });
        }

        user = await prisma.user.create({
          data: {
            email: cleanEmail,
            githubId: githubIdStr,
            githubUsername: githubUsernameStr,
            alias,
            credits: 0, // Ledger entry increments atomically to 500
            reputation: 100,
            ghostStrikes: 0,
            banned: false
          }
        });

        // Grant genesis onboarding credits
        await recordLedgerEntry({
          userId: user.id,
          type: 'REWARD_CREDIT',
          amount: 500,
          repDelta: 0,
          notes: 'Initial onboarding credits genesis grant (GitHub OAuth)'
        });

        // Fetch refreshed user record with credits populated
        user = await prisma.user.findUnique({ where: { id: user.id } });
      }
    }

    if (user.banned) {
      res.setHeader('Set-Cookie', clearStateCookie);
      return res.redirect(302, '/login?error=account_banned');
    }

    // Generate authenticated session token
    const token = createSessionToken(user.id, user.alias);
    res.setHeader('Set-Cookie', [
      clearStateCookie,
      serializeSessionCookie(token),
      `graveyard_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    ]);

    return res.redirect(302, '/dashboard');
  } catch (err) {
    console.error('GitHub OAuth callback processing exception:', err);
    res.setHeader('Set-Cookie', clearStateCookie);
    return res.redirect(302, '/login?error=oauth_internal_error');
  }
}
