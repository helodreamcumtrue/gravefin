import prisma from '../../../lib/prisma';
import { verifyPassword, sanitizeUser, createSessionToken, serializeSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
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

    // Generate cryptographic session token
    const token = createSessionToken(user.id, user.alias);
    
    // Set HTTP-Only Cookie
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
