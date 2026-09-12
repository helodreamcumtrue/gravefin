import prisma from '../../../lib/prisma';
import { applyTakerGhostPenalty, applyOwnerGhostPenalty, recordLedgerEntry } from '../../../lib/ledger';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { secret, simulateDaysElapsed = 0 } = req.body || req.query || {};

    // Allow internal cron calls or simulation console
    const validSecret = process.env.CRON_SECRET || 'graveyard_secret_key';
    const isAuthorized = secret === validSecret || req.headers['x-cron-secret'] === validSecret || process.env.NODE_ENV !== 'production';

    if (!isAuthorized) {
      return res.status(401).json({ error: 'Unauthorized cron trigger' });
    }

    // Effective reference date (can be shifted by simulateDaysElapsed for testing)
    const effectiveNow = new Date(Date.now() + Number(simulateDaysElapsed) * 24 * 60 * 60 * 1000);

    const log = [];

    // =========================================================================
    // 1. TAKER GHOST DETECTION (ACTIVE commitments past ghostDeadlineAt)
    // =========================================================================
    const ghostedTakers = await prisma.commitment.findMany({
      where: {
        status: 'ACTIVE',
        ghostDeadlineAt: {
          lte: effectiveNow
        }
      },
      include: { project: true, taker: true }
    });

    for (const comm of ghostedTakers) {
      await applyTakerGhostPenalty({
        takerId: comm.takerId,
        ownerId: comm.project.ownerId,
        projectId: comm.projectId,
        commitmentId: comm.id,
        stakeAmount: comm.stakeLocked
      });

      await prisma.commitment.update({
        where: { id: comm.id },
        data: {
          status: 'GHOSTED',
          resolvedAt: effectiveNow
        }
      });

      await prisma.project.update({
        where: { id: comm.projectId },
        data: {
          status: 'LISTED'
        }
      });

      log.push(`[TAKER GHOST] Commitment ${comm.id} for project "${comm.project.title}". Stake ${comm.stakeLocked} forfeited to owner. Taker ${comm.taker.alias} penalized (-20 rep, +1 strike). Project relisted.`);
    }

    // =========================================================================
    // 2. OWNER GHOST DETECTION (SUBMITTED commitments past reviewTimeoutAt)
    // =========================================================================
    const ghostedOwners = await prisma.project.findMany({
      where: {
        status: 'SUBMITTED',
        reviewTimeoutAt: {
          lte: effectiveNow
        }
      },
      include: {
        commitments: {
          where: { status: 'SUBMITTED' },
          include: { taker: true }
        }
      }
    });

    for (const project of ghostedOwners) {
      const comm = project.commitments[0];
      if (comm) {
        await applyOwnerGhostPenalty({
          takerId: comm.takerId,
          ownerId: project.ownerId,
          projectId: project.id,
          commitmentId: comm.id,
          stakeAmount: comm.stakeLocked,
          rewardAmount: 100
        });

        await prisma.commitment.update({
          where: { id: comm.id },
          data: {
            status: 'COMPLETED',
            resolvedAt: effectiveNow
          }
        });

        await prisma.project.update({
          where: { id: project.id },
          data: {
            status: 'COMPLETED',
            completion: 100,
            reviewTimeoutAt: null
          }
        });

        log.push(`[OWNER GHOST] Project "${project.title}" review window expired. Taker refunded ${comm.stakeLocked} stake + 100 reward credits (+15 rep). Owner penalized (-10 rep, +1 strike). Project auto-completed.`);
      }
    }

    // =========================================================================
    // 3. MILESTONE CHECKS (ACTIVE commitments with overdue pending milestones)
    // =========================================================================
    const overdueMilestones = await prisma.milestone.findMany({
      where: {
        status: 'PENDING',
        dueAt: { lte: effectiveNow },
        commitment: { status: 'ACTIVE' }
      },
      include: {
        commitment: {
          include: { project: true, taker: true }
        }
      }
    });

    for (const ms of overdueMilestones) {
      const newMissCount = ms.missCount + 1;

      if (newMissCount >= 3) {
        // Severe miss path: treated as full ghost
        await applyTakerGhostPenalty({
          takerId: ms.commitment.takerId,
          ownerId: ms.commitment.project.ownerId,
          projectId: ms.commitment.projectId,
          commitmentId: ms.commitment.id,
          stakeAmount: ms.commitment.stakeLocked
        });

        await prisma.commitment.update({
          where: { id: ms.commitment.id },
          data: { status: 'GHOSTED', resolvedAt: effectiveNow }
        });

        await prisma.project.update({
          where: { id: ms.commitment.projectId },
          data: { status: 'LISTED' }
        });

        await prisma.milestone.update({
          where: { id: ms.id },
          data: { status: 'MISSED', missCount: newMissCount }
        });

        log.push(`[MILESTONE SEVERE] 3rd milestone missed on commitment ${ms.commitment.id}. Treated as ghost: stake forfeited, -20 rep, +1 strike.`);
      } else if (newMissCount === 2) {
        // Repeated miss: -5 rep
        await recordLedgerEntry({
          userId: ms.commitment.takerId,
          type: 'REP_DELTA',
          amount: 0,
          repDelta: -5,
          relatedProjectId: ms.commitment.projectId,
          relatedCommitmentId: ms.commitment.id,
          notes: `Repeated milestone miss on "${ms.title}"`
        });

        await prisma.milestone.update({
          where: { id: ms.id },
          data: { status: 'MISSED', missCount: newMissCount }
        });

        log.push(`[MILESTONE MISSED] Repeated miss on "${ms.title}". -5 rep applied to taker.`);
      } else {
        // 1st miss: warning only
        await prisma.milestone.update({
          where: { id: ms.id },
          data: { status: 'MISSED', missCount: newMissCount }
        });

        log.push(`[MILESTONE WARNING] 1st miss on "${ms.title}". Warning logged, no credit/rep penalty.`);
      }
    }

    return res.status(200).json({
      success: true,
      effectiveDate: effectiveNow.toISOString(),
      processedGhostedTakers: ghostedTakers.length,
      processedGhostedOwners: ghostedOwners.length,
      processedMilestones: overdueMilestones.length,
      events: log
    });
  } catch (err) {
    console.error('Cron timeout-check error:', err);
    return res.status(500).json({ error: 'Internal server error in cron job' });
  }
}
