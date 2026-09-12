import prisma from '../../../lib/prisma';
import { parseSession } from '../../../lib/auth';
import { recordLedgerEntry } from '../../../lib/ledger';

/**
 * Unified Commitments API Route Handler
 * Consolidates submit, withdraw, verify, and milestone completion
 * Matches:
 *  - /api/commitments/:id/submit
 *  - /api/commitments/:id/withdraw
 *  - /api/commitments/:id/verify
 *  - /api/commitments/:id/milestones/:mid/complete
 */
export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug || slug.length < 2) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  const commitmentId = slug[0];
  const action = slug[1];

  if (action === 'submit') {
    return handleSubmit(req, res, commitmentId);
  }

  if (action === 'withdraw') {
    return handleWithdraw(req, res, commitmentId);
  }

  if (action === 'verify') {
    return handleVerify(req, res, commitmentId);
  }

  if (action === 'milestones' && slug.length >= 4 && slug[3] === 'complete') {
    const milestoneId = slug[2];
    return handleMilestoneComplete(req, res, commitmentId, milestoneId);
  }

  return res.status(404).json({ error: `Action '${slug.slice(1).join('/')}' not found for commitment` });
}

// 1. POST /api/commitments/:id/submit
async function handleSubmit(req, res, id) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const takerId = parseSession(req);
    if (!takerId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const { notes = '', deliverableUrl = '' } = req.body || {};

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

// 2. POST /api/commitments/:id/withdraw
async function handleWithdraw(req, res, id) {
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

// 3. POST /api/commitments/:id/verify
async function handleVerify(req, res, id) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ownerId = parseSession(req);
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const { decision } = req.body || {}; // 'approve' | 'flagBadFaith'

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

// 4. POST /api/commitments/:id/milestones/:mid/complete
async function handleMilestoneComplete(req, res, id, mid) {
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
