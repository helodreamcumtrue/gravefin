import prisma from '../../../../lib/prisma';
import { parseSession } from '../../../../lib/auth';
import { recordLedgerEntry } from '../../../../lib/ledger';

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

    const commitment = await prisma.commitment.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!commitment) return res.status(404).json({ error: 'Commitment not found' });
    if (commitment.takerId !== takerId) {
      return res.status(403).json({ error: 'You can only withdraw your own commitment' });
    }

    // Check status: Taker cancels pre-approval (Rep -2)
    if (commitment.status === 'PENDING_APPROVAL') {
      await recordLedgerEntry({
        userId: takerId,
        type: 'REP_DELTA',
        amount: 0,
        repDelta: -2,
        relatedProjectId: commitment.projectId,
        relatedCommitmentId: commitment.id,
        notes: 'Taker cancelled commitment request before owner approval'
      });

      await prisma.commitment.update({
        where: { id: commitment.id },
        data: { status: 'CANCELLED', resolvedAt: new Date() }
      });

      await prisma.project.update({
        where: { id: commitment.projectId },
        data: { status: 'LISTED' }
      });

      return res.status(200).json({
        message: 'Commitment withdrawn. -2 reputation penalty recorded. Project relisted.'
      });
    }

    return res.status(400).json({
      error: `Cannot withdraw commitment in ${commitment.status} status.`
    });
  } catch (err) {
    console.error('Withdraw error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
