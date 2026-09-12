import prisma from '../../../lib/prisma';
import { parseSession, sanitizeUser, serializeClearCookie } from '../../../lib/auth';

export default async function handler(req, res) {
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
      // Stale cookie from a reset database -> clear cookie cleanly
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
