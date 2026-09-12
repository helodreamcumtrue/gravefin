import bcrypt from 'bcryptjs';

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

export function parseSession(req) {
  // Simple session lookup via header 'x-user-id' or cookie for development & seamless role switching
  const userId = req.headers['x-user-id'] || req.cookies?.['graveyard_user_id'];
  return userId || null;
}
