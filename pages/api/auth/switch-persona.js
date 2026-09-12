import prisma from '../../../lib/prisma';
import { sanitizeUser, createSessionToken, serializeSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
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

    // Generate cryptographic session token for this persona
    const token = createSessionToken(user.id, user.alias);

    // Set signed cookie so all subsequent browser requests (including downloads) are authenticated
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
