import prisma from '../../../../lib/prisma';
import { parseSession } from '../../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = parseSession(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ledger = await prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ ledger });
  } catch (err) {
    console.error('Error fetching ledger:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
