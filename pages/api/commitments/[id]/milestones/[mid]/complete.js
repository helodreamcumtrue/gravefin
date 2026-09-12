import prisma from '../../../../../../lib/prisma';
import { parseSession } from '../../../../../../lib/auth';

export default async function handler(req, res) {
  const { id, mid } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const takerId = parseSession(req);
    if (!takerId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const commitment = await prisma.commitment.findUnique({
      where: { id },
      include: { milestones: true }
    });

    if (!commitment) return res.status(404).json({ error: 'Commitment not found' });
    if (commitment.takerId !== takerId) {
      return res.status(403).json({ error: 'Only the committed taker can update milestones' });
    }

    const milestone = commitment.milestones.find(m => m.id === mid);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    const updated = await prisma.milestone.update({
      where: { id: mid },
      data: { status: 'MET' }
    });

    return res.status(200).json({
      milestone: updated,
      message: `Milestone "${updated.title}" marked as MET.`
    });
  } catch (err) {
    console.error('Milestone update error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
