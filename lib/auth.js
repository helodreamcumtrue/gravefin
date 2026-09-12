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
