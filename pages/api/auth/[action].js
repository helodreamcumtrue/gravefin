import prisma from '../../../lib/prisma';
import {
  generateAlias,
  hashPassword,
  verifyPassword,
  sanitizeUser,
  createSessionToken,
  parseSession,
  serializeSessionCookie,
  serializeClearCookie
} from '../../../lib/auth';
import { recordLedgerEntry } from '../../../lib/ledger';

/**
 * Unified Authentication API Route Handler
 * Consolidates login, signup, logout, me, personas, and switch-persona
 * Matches /api/auth/:action
 */
export default async function handler(req, res) {
  const { action } = req.query;

  switch (action) {
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
    default:
      return res.status(404).json({ error: `Auth endpoint '/api/auth/${action}' not found` });
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

    if (user.banned) {
      return res.status(403).json({ error: 'This account has been terminated due to excessive protocol ghost strikes.' });
    }

    const match = await verifyPassword(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = createSessionToken(user.id, user.alias);
    res.setHeader('Set-Cookie', [
      serializeSessionCookie(token),
      `graveyard_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    ]);

    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user, true)
    });
  } catch (err) {
    console.error('Login error:', err);
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

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
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
    const initialCredits = 500;
    const initialReputation = 100;

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        alias,
        credits: initialCredits,
        reputation: initialReputation,
        ghostStrikes: 0,
        banned: false
      }
    });

    await recordLedgerEntry({
      userId: user.id,
      type: 'REWARD_CREDIT',
      amount: initialCredits,
      repDelta: 0,
      notes: 'Initial onboarding credits genesis grant'
    });

    const token = createSessionToken(user.id, user.alias);
    res.setHeader('Set-Cookie', [
      serializeSessionCookie(token),
      `graveyard_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    ]);

    return res.status(201).json({
      success: true,
      token,
      user: sanitizeUser(user, true)
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 3. POST or GET /api/auth/logout
async function handleLogout(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Set-Cookie', [
    serializeClearCookie(),
    'graveyard_user_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ]);

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}

// 4. GET /api/auth/me
async function handleMe(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = parseSession(req);
    if (!userId) {
      return res.status(200).json({ authenticated: false, user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.setHeader('Set-Cookie', [
        serializeClearCookie(),
        'graveyard_user_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
      ]);
      return res.status(200).json({ authenticated: false, user: null });
    }

    if (user.banned) {
      return res.status(403).json({
        authenticated: false,
        error: 'Account suspended due to 3 ghost strikes.'
      });
    }

    return res.status(200).json({
      authenticated: true,
      user: sanitizeUser(user, true)
    });
  } catch (err) {
    console.error('Error in /api/auth/me:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 5. GET /api/auth/personas
async function handlePersonas(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
      take: 6
    });

    return res.status(200).json({
      personas: users.map(u => sanitizeUser(u, false))
    });
  } catch (err) {
    console.error('Error listing personas:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 6. POST /api/auth/switch-persona
async function handleSwitchPersona(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, alias } = req.body || {};
    if (!userId && !alias) {
      return res.status(400).json({ error: 'userId or alias is required' });
    }

    const where = userId ? { id: userId } : { alias };
    const user = await prisma.user.findUnique({ where });

    if (!user) {
      return res.status(404).json({ error: 'Persona user not found' });
    }

    const token = createSessionToken(user.id, user.alias);
    res.setHeader('Set-Cookie', [
      serializeSessionCookie(token),
      `graveyard_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
    ]);

    return res.status(200).json({
      success: true,
      token,
      user: sanitizeUser(user, true)
    });
  } catch (err) {
    console.error('Error switching persona:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
