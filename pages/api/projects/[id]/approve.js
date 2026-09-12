import prisma from '../../../../lib/prisma';
import { parseSession } from '../../../../lib/auth';
import { recordLedgerEntry } from '../../../../lib/ledger';

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
          where: { id: commitmentId },
          include: { taker: true }
        }
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.ownerId !== ownerId) {
      return res.status(403).json({ error: 'Only the project owner can approve commitments' });
    }

    const commitment = project.commitments[0];
    if (!commitment || commitment.status !== 'PENDING_APPROVAL') {
      return res.status(400).json({ error: 'No pending commitment found to approve' });
    }

    // Verify Taker still has sufficient credits for the required stake
    if (commitment.taker.credits < project.stakeRequired) {
      // Auto-reject due to insufficient credits at approval time (Edge Case §8)
      await prisma.commitment.update({
        where: { id: commitment.id },
        data: { status: 'CANCELLED', resolvedAt: new Date() }
      });
      await prisma.project.update({
        where: { id: project.id },
        data: { status: 'LISTED' }
      });
      return res.status(400).json({
        error: 'Taker no longer has sufficient credits for the stake requirement. Commitment cancelled and project relisted.'
      });
    }

    const ghostDeadlineAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days

    // Lock stake in atomic ledger transaction
    await recordLedgerEntry({
      userId: commitment.takerId,
      type: 'STAKE_LOCK',
      amount: -project.stakeRequired,
      repDelta: 0,
      relatedProjectId: project.id,
      relatedCommitmentId: commitment.id,
      notes: `Locked ${project.stakeRequired} credits stake in escrow for ${project.title}`
    });

    const updatedCommitment = await prisma.commitment.update({
      where: { id: commitment.id },
      data: {
        status: 'ACTIVE',
        stakeLocked: project.stakeRequired,
        approvedAt: new Date(),
        ghostDeadlineAt
      }
    });

    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'ACTIVE' }
    });

    return res.status(200).json({
      commitment: updatedCommitment,
      message: 'Commitment approved. Taker stake locked in escrow. Blind work phase is now ACTIVE.'
    });
  } catch (err) {
    console.error('Approve error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
