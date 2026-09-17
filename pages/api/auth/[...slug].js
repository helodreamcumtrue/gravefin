import crypto from 'crypto';
import prisma from '../../../lib/prisma';
import {
  generateAlias,
  hashPassword,
  verifyPassword,
  sanitizeUser,
  createSessionToken,
  parseSession,
  serializeSessionCookie,
  serializeClearCookie,
  parseCookieHeader
} from '../../../lib/auth';
import { recordLedgerEntry } from '../../../lib/ledger';

/**
 * Unified Authentication API Route Handler
 * Consolidates login, signup, logout, me, personas, switch-persona, github, and github/callback
 * Matches /api/auth/:action or /api/auth/*
 */
export default async function handler(req, res) {
  const { slug, action: singleAction } = req.query;
  const pathParts = Array.isArray(slug) ? slug : (slug ? [slug] : (singleAction ? [singleAction] : []));
  const primaryAction = pathParts[0];

  switch (primaryAction) {
    case 'login':
      return handleLogin(req, res);
    case 'signup':
      return handleSignup(req, res);
    case 'logout':
      return handleLogout(req, res);
    case 'me':
      return handleMe(req, res);
    case 'personas':
      return handlePersonas(req, res);
    case 'switch-persona':
      return handleSwitchPersona(req, res);
    case 'github':
      if (pathParts.length > 1 && pathParts[1] === 'callback') {
        return handleGitHubCallback(req, res);
      }
      return handleGitHubInit(req, res);
    default:
      return res.status(404).json({ error: `Auth endpoint '/api/auth/${pathParts.join('/')}' not found` });
  }
}

// 1. POST /api/auth/login
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.banned) {
      return res.status(403).json({ error: 'This account has been banned due to excessive ghost strikes.' });
    }

    const token = createSessionToken(user.id, user.alias);
    res.setHeader('Set-Cookie', [
      serializeSessionCookie(token),
      `graveyard_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    ]);

    return res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Error logging in user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 2. POST /api/auth/signup
async function handleSignup(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail }
    });

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    let alias = generateAlias();
    let aliasExists = await prisma.user.findUnique({ where: { alias } });
    while (aliasExists) {
      alias = generateAlias();
      aliasExists = await prisma.user.findUnique({ where: { alias } });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        alias,
        credits: 0,
        reputation: 100,
        ghostStrikes: 0,
        banned: false
      }
    });

    await recordLedgerEntry({
      userId: user.id,
      type: 'REWARD_CREDIT',
      amount: 500,
      repDelta: 0,
      notes: 'Initial onboarding credits grant'
    });

    const refreshedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    const token = createSessionToken(user.id, user.alias);
    res.setHeader('Set-Cookie', [
      serializeSessionCookie(token),
      `graveyard_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    ]);

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: sanitizeUser(refreshedUser)
    });
  } catch (err) {
    console.error('Error creating user account:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 3. POST /api/auth/logout
async function handleLogout(req, res) {
  res.setHeader('Set-Cookie', [
    serializeClearCookie(),
    'graveyard_user_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ]);
  return res.status(200).json({ message: 'Logged out successfully' });
}

// 4. GET /api/auth/me
async function handleMe(req, res) {
  try {
    let userId = parseSession(req);
    if (!userId) {
      const cookieHeader = req.headers.cookie;
      if (cookieHeader) {
        const match = cookieHeader.match(/graveyard_user_id=([^;]+)/);
        if (match) userId = match[1];
      }
    }
    if (!userId) {
      userId = req.headers['x-user-id'];
    }

    if (!userId) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    return res.status(200).json({
      authenticated: true,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Error fetching authenticated profile:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 5. GET /api/auth/personas
async function handlePersonas(req, res) {
  try {
    const users = await prisma.user.findMany({
      where: { banned: false },
      orderBy: { reputation: 'desc' },
      take: 8
    });

    return res.status(200).json({
      personas: users.map(u => sanitizeUser(u))
    });
  } catch (err) {
    console.error('Error listing demo personas:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 6. POST /api/auth/switch-persona
async function handleSwitchPersona(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User persona not found' });
    }

    const token = createSessionToken(user.id, user.alias);
    res.setHeader('Set-Cookie', [
      serializeSessionCookie(token),
      `graveyard_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    ]);

    return res.status(200).json({
      message: `Switched active persona to ${user.alias}`,
      token,
      user: sanitizeUser(user)
    });
  } catch (err) {
    console.error('Error switching active persona:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 7. GET /api/auth/github (Initiate OAuth)
async function handleGitHubInit(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const cleanClientId = (clientId || '').replace(/^["']|["']$/g, '').trim();

  const proto = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const configuredBaseUrl = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  const baseUrl = configuredBaseUrl && !(process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/.test(configuredBaseUrl))
    ? configuredBaseUrl
    : `${proto}://${host}`;
  const redirectUri = `${baseUrl}/api/auth/github/callback`;

  const state = crypto.randomBytes(16).toString('hex');
  const isProd = process.env.NODE_ENV === 'production';
  const stateCookie = `gh_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${isProd ? '; Secure' : ''}`;

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

// 8. GET /api/auth/github/callback (Handle OAuth Return)
async function handleGitHubCallback(req, res) {
  const { code, state, error: ghError, error_description } = req.query;

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

    if (typeof code === 'string' && code.startsWith('mock_dev_code_')) {
      const mockId = `mock_${code.slice(-6)}`;
      ghUser = {
        id: 88812345,
        login: `github_dev_${mockId}`,
        name: 'GitHub Developer (Demo)'
      };
      userEmail = `${ghUser.login}@graveyard.local`;
    } else {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        res.setHeader('Set-Cookie', clearStateCookie);
        return res.redirect(302, '/login?error=github_not_configured');
      }

      const proto = req.headers['x-forwarded-proto'] || (req.headers.host?.includes('localhost') ? 'http' : 'https');
      const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
      const configuredBaseUrl = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
      const baseUrl = configuredBaseUrl && !(process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/.test(configuredBaseUrl))
        ? configuredBaseUrl
        : `${proto}://${host}`;
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

    let user = await prisma.user.findUnique({
      where: { githubId: githubIdStr }
    });

    if (user) {
      if (user.githubUsername !== githubUsernameStr) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { githubUsername: githubUsernameStr }
        });
      }
    } else {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: cleanEmail }
      });

      if (existingByEmail) {
        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            githubId: githubIdStr,
            githubUsername: githubUsernameStr
          }
        });
      } else {
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
            credits: 0,
            reputation: 100,
            ghostStrikes: 0,
            banned: false
          }
        });

        await recordLedgerEntry({
          userId: user.id,
          type: 'REWARD_CREDIT',
          amount: 500,
          repDelta: 0,
          notes: 'Initial onboarding credits genesis grant (GitHub OAuth)'
        });

        user = await prisma.user.findUnique({ where: { id: user.id } });
      }
    }

    if (user.banned) {
      res.setHeader('Set-Cookie', clearStateCookie);
      return res.redirect(302, '/login?error=account_banned');
    }

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
