import prisma from '../../../../lib/prisma';
import { parseSession } from '../../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const takerId = parseSession(req);
    if (!takerId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const { notes = '', deliverableUrl = '' } = req.body;

    const commitment = await prisma.commitment.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!commitment) return res.status(404).json({ error: 'Commitment not found' });
    if (commitment.takerId !== takerId) {
      return res.status(403).json({ error: 'You can only submit for your own commitment' });
    }

    if (commitment.status !== 'ACTIVE') {
      return res.status(400).json({ error: `Commitment is not active (current status: ${commitment.status})` });
    }

    const reviewTimeoutAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days review window

    const updatedCommitment = await prisma.commitment.update({
      where: { id: commitment.id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        submissionNotes: notes,
        submissionUrl: deliverableUrl || '/downloads/deliverable.zip'
      }
    });

    await prisma.project.update({
      where: { id: commitment.projectId },
      data: {
        status: 'SUBMITTED',
        reviewTimeoutAt
      }
    });

    return res.status(200).json({
      commitment: updatedCommitment,
      message: 'Completed work submitted successfully. Owner has 7 days to verify. If owner ghosts, escrow releases automatically.'
    });
  } catch (err) {
    console.error('Submit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
