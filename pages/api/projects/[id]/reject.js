import prisma from '../../../../lib/prisma';
import { parseSession } from '../../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ownerId = parseSession(req);
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const { commitmentId } = req.body;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        commitments: {
          where: { id: commitmentId }
        }
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== ownerId) {
      return res.status(403).json({ error: 'Only the project owner can reject commitments' });
    }

    const commitment = project.commitments[0];
    if (!commitment) {
      return res.status(400).json({ error: 'Commitment not found' });
    }

    await prisma.commitment.update({
      where: { id: commitment.id },
      data: {
        status: 'CANCELLED',
        resolvedAt: new Date()
      }
    });

    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'LISTED' }
    });

    return res.status(200).json({
      message: 'Commitment rejected without penalty. Project relisted.'
    });
  } catch (err) {
    console.error('Reject error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
