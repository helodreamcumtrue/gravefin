import prisma from '../../../lib/prisma';
import { sanitizeUser } from '../../../lib/auth';

export default async function handler(req, res) {
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
