import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.CRON_SECRET || 'digital_graveyard_secret_key_production_2026';

export function generateAlias() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `Digger-${num}`;
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Creates a tamper-proof cryptographically signed session token.
 * Payload: { userId, alias, exp, iat }
 */
export function createSessionToken(userId, alias) {
  const payload = {
    userId,
    alias: alias || 'Digger',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60 // 30 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

/**
 * Verifies the cryptographic HMAC signature and expiry of a session token.
 */
export function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.exp && nowSec > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Formats standard Set-Cookie header for the session token
 */
export function serializeSessionCookie(token) {
  const isProd = process.env.NODE_ENV === 'production';
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  return `graveyard_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isProd ? '; Secure' : ''}`;
}

/**
 * Formats Set-Cookie header to invalidate/clear the session on logout
 */
export function serializeClearCookie() {
  const isProd = process.env.NODE_ENV === 'production';
  return `graveyard_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${isProd ? '; Secure' : ''}`;
}

/**
 * Helper to parse raw Cookie header string into key-value map
 */
export function parseCookieHeader(cookieHeader = '') {
  const map = {};
  if (!cookieHeader) return map;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx < 0) continue;
    const key = pair.substring(0, idx).trim();
    const val = pair.substring(idx + 1).trim();
    map[key] = decodeURIComponent(val);
  }
  return map;
}

/**
 * Strips sensitive identity fields.
 * Only the user themselves may see their own email.
 * Password hash is never exposed.
 */
export function sanitizeUser(user, isSelf = false) {
  if (!user) return null;
  const { passwordHash, email, ...rest } = user;
  if (isSelf) {
    return { ...rest, email };
  }
  return { ...rest };
}

/**
 * Universally authenticates an incoming request:
 * 1. Checks signed HttpOnly cookie 'graveyard_session'
 * 2. Checks 'Authorization: Bearer <token>' header
 * 3. Checks 'x-user-id' header or legacy 'graveyard_user_id' cookie (dev/testing fallback)
 */
export function parseSession(req) {
  if (!req) return null;

  // 1. Check cookies for signed cryptographic session
  const rawCookie = req.headers?.cookie || '';
  const cookies = req.cookies || parseCookieHeader(rawCookie);
  const sessionToken = cookies['graveyard_session'];

  if (sessionToken) {
    const verified = verifySessionToken(sessionToken);
    if (verified?.userId) {
      return verified.userId;
    }
  }

  // 2. Check Authorization header: Bearer <token>
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = verifySessionToken(token);
    if (verified?.userId) {
      return verified.userId;
    }
  }

  // 3. Fallback for testing personas and direct headless testing
  const explicitUserId = req.headers?.['x-user-id'] || cookies['graveyard_user_id'];
  if (explicitUserId) {
    return explicitUserId;
  }

  return null;
}

/**
 * Resolves a database User record given an arbitrary identifier:
 * - Direct ID lookup (e.g. CUID 'cmtyvgm8i0000k14cv895u0re')
 * - Fallback persona ID ('user-1' through 'user-6') mapped to standard emails
 * - Email address
 * - Alias (e.g. 'Digger-1042')
 * - Fallback demo ID ('user-178...'), mapped to the primary active unbanned user
 */
export async function resolveDbUser(prismaClient, identifier) {
  if (!identifier || typeof identifier !== 'string') return null;

  try {
    const cleanId = identifier.trim();

    // 1. Direct ID lookup
    let user = await prismaClient.user.findUnique({
      where: { id: cleanId }
    });
    if (user) return user;

    // 2. Persona ID map
    const personaMap = {
      'user-1': 'sarah.chen@campus.edu',
      'user-2': 'alex.rivera@campus.edu',
      'user-3': 'elena.rostova@campus.edu',
      'user-4': 'marcus.vance@campus.edu',
      'user-5': 'chloe.zhao@campus.edu',
      'user-6': 'devbot@graveyard.fi'
    };

    const mappedEmail = personaMap[cleanId];
    if (mappedEmail) {
      user = await prismaClient.user.findUnique({
        where: { email: mappedEmail }
      });
      if (user) return user;
    }

    // 3. Email lookup
    if (cleanId.includes('@')) {
      user = await prismaClient.user.findUnique({
        where: { email: cleanId.toLowerCase() }
      });
      if (user) return user;
    }

    // 4. Alias lookup
    user = await prismaClient.user.findUnique({
      where: { alias: cleanId }
    });
    if (user) return user;

    // 5. Fallback for demo personas / guest testing IDs:
    if (cleanId.startsWith('user-')) {
      const allUsers = await prismaClient.user.findMany({
        where: { banned: false },
        orderBy: { reputation: 'desc' }
      });
      if (allUsers && allUsers.length > 0) {
        return allUsers[0];
      }
    }

    return null;
  } catch (err) {
    console.warn('resolveDbUser lookup error:', err.message);
    return null;
  }
}

