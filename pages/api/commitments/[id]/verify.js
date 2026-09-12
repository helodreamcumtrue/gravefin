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

    const { decision } = req.body; // 'approve' | 'flagBadFaith'

    const commitment = await prisma.commitment.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!commitment) return res.status(404).json({ error: 'Commitment not found' });
    if (commitment.project.ownerId !== ownerId) {
      return res.status(403).json({ error: 'Only the project owner can verify submissions' });
    }

    if (commitment.status !== 'SUBMITTED') {
      return res.status(400).json({ error: `Cannot verify commitment in ${commitment.status} status` });
    }

    const rewardCredits = 100; // Standard platform completion reward

    if (decision === 'approve') {
      // 1. Refund Taker's locked stake
      if (commitment.stakeLocked > 0) {
        await recordLedgerEntry({
          userId: commitment.takerId,
          type: 'STAKE_REFUND',
          amount: commitment.stakeLocked,
          relatedProjectId: commitment.projectId,
          relatedCommitmentId: commitment.id,
          notes: `Stake released upon verified completion of ${commitment.project.title}`
        });
      }

      // 2. Grant reward credits and +15 rep to Taker
      await recordLedgerEntry({
        userId: commitment.takerId,
        type: 'REWARD_CREDIT',
        amount: rewardCredits,
        repDelta: 15,
        relatedProjectId: commitment.projectId,
        relatedCommitmentId: commitment.id,
        notes: `Completion reward earned for successfully finishing ${commitment.project.title}`
      });

      // 3. Grant +15 rep to Owner for successful project revival
      await recordLedgerEntry({
        userId: ownerId,
        type: 'REP_DELTA',
        amount: 0,
        repDelta: 15,
        relatedProjectId: commitment.projectId,
        relatedCommitmentId: commitment.id,
        notes: `Reputation gained for successful project completion: ${commitment.project.title}`
      });

      // 4. Update Commitment and Project to COMPLETED
      await prisma.commitment.update({
        where: { id: commitment.id },
        data: {
          status: 'COMPLETED',
          resolvedAt: new Date()
        }
      });

      await prisma.project.update({
        where: { id: commitment.projectId },
        data: {
          status: 'COMPLETED',
          completion: 100,
          reviewTimeoutAt: null
        }
      });

      return res.status(200).json({
        message: 'Submission verified and approved! Escrow stake released and reward credited to Taker. Project marked COMPLETED.'
      });
    } else if (decision === 'flagBadFaith') {
      // Bad-Faith / Plagiarism flagged:
      // Stake forfeited to Owner, Taker -15 rep, project relisted
      if (commitment.stakeLocked > 0) {
        await recordLedgerEntry({
          userId: ownerId,
          type: 'STAKE_FORFEIT',
          amount: commitment.stakeLocked,
          relatedProjectId: commitment.projectId,
          relatedCommitmentId: commitment.id,
          notes: `Forfeited taker stake transferred to owner due to bad-faith/plagiarism flag`
        });
      }

      await recordLedgerEntry({
        userId: commitment.takerId,
        type: 'REP_DELTA',
        amount: 0,
        repDelta: -15,
        relatedProjectId: commitment.projectId,
        relatedCommitmentId: commitment.id,
        notes: `Penalty applied for bad-faith/plagiarized submission on ${commitment.project.title}`
      });

      await prisma.commitment.update({
        where: { id: commitment.id },
        data: {
          status: 'REJECTED_BADFAITH',
          resolvedAt: new Date()
        }
      });

      await prisma.project.update({
        where: { id: commitment.projectId },
        data: {
          status: 'LISTED',
          reviewTimeoutAt: null
        }
      });

      return res.status(200).json({
        message: 'Submission flagged as bad-faith/plagiarism. Taker stake forfeited to owner and -15 reputation penalty applied. Project relisted.'
      });
    }

    return res.status(400).json({ error: "Invalid decision. Must be 'approve' or 'flagBadFaith'" });
  } catch (err) {
    console.error('Verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
