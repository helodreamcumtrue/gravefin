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

    const taker = await prisma.user.findUnique({ where: { id: takerId } });
    if (!taker) return res.status(404).json({ error: 'User not found' });
    if (taker.banned) {
      return res.status(403).json({ error: 'Account restricted due to ghost strikes (3+ strikes).' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        commitments: {
          where: {
            status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUBMITTED'] }
          }
        }
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.ownerId === takerId) {
      return res.status(400).json({ error: 'You cannot claim your own project' });
    }

    if (project.commitments.length > 0) {
      return res.status(409).json({ error: 'This project already has an active commitment' });
    }

    if (taker.credits < project.stakeRequired) {
      return res.status(400).json({
        error: `Insufficient credits for stake. Required: ${project.stakeRequired}, Available: ${taker.credits}`
      });
    }

    // Create commitment and update project status
    const commitment = await prisma.commitment.create({
      data: {
        projectId: project.id,
        takerId,
        status: 'PENDING_APPROVAL',
        stakeLocked: 0, // Not locked until Owner approves
        committedAt: new Date()
      }
    });

    // If milestoneMode is enabled, create default milestone stages
    if (project.milestoneMode) {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      await prisma.milestone.createMany({
        data: [
          {
            commitmentId: commitment.id,
            title: 'M1: Architecture Review & Environment Setup',
            dueAt: new Date(now + 4 * day),
            status: 'PENDING'
          },
          {
            commitmentId: commitment.id,
            title: 'M2: Core Features & Logic Implementation',
            dueAt: new Date(now + 9 * day),
            status: 'PENDING'
          },
          {
            commitmentId: commitment.id,
            title: 'M3: Final Polish & Completion Delivery',
            dueAt: new Date(now + 14 * day),
            status: 'PENDING'
          }
        ]
      });
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'PENDING_APPROVAL' }
    });

    return res.status(201).json({ commitment });
  } catch (err) {
    console.error('Commit error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
