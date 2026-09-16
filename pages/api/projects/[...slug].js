import fs from 'fs';
import path from 'path';
import prisma from '../../../lib/prisma';
import { parseSession } from '../../../lib/auth';
import { recordLedgerEntry } from '../../../lib/ledger';
import { enrichProject } from '../../../lib/mockFallback';

/**
 * Unified Project Details & Actions Route Handler
 * Consolidates project details, commit, approve, reject, and download.
 * Matches:
 *  - GET  /api/projects/:id
 *  - POST /api/projects/:id/commit
 *  - POST /api/projects/:id/approve
 *  - POST /api/projects/:id/reject
 *  - GET  /api/projects/:id/download
 */
export default async function handler(req, res) {
  const { slug } = req.query;

  if (!slug || slug.length < 1) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  const projectId = slug[0];
  const action = slug[1];

  // If no sub-action, fetch project detail
  if (!action) {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    return handleGetProject(req, res, projectId);
  }

  switch (action) {
    case 'commit':
      return handleCommit(req, res, projectId);
    case 'approve':
      return handleApprove(req, res, projectId);
    case 'reject':
      return handleReject(req, res, projectId);
    case 'download':
      return handleDownload(req, res, projectId);
    default:
      return res.status(404).json({ error: `Action '${action}' not found for project` });
  }
}

// 1. GET /api/projects/:id
async function handleGetProject(req, res, id) {
  try {
    const currentUserId = parseSession(req);

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, alias: true, reputation: true, ghostStrikes: true }
        },
        commitments: {
          where: {
            status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUBMITTED', 'COMPLETED', 'REJECTED_BADFAITH'] }
          },
          orderBy: { committedAt: 'desc' },
          include: {
            taker: {
              select: { id: true, alias: true, reputation: true, ghostStrikes: true }
            },
            milestones: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const activeCommitment = project.commitments.find(c =>
      ['PENDING_APPROVAL', 'ACTIVE', 'SUBMITTED'].includes(c.status)
    ) || project.commitments[0] || null;

    const isOwner = currentUserId === project.ownerId;
    const isTaker = activeCommitment && currentUserId === activeCommitment.takerId;

    return res.status(200).json({
      project: enrichProject(project),
      activeCommitment,
      userRole: isOwner ? 'OWNER' : isTaker ? 'TAKER' : 'GUEST'
    });
  } catch (err) {
    console.error('Error fetching project:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// 2. POST /api/projects/:id/commit
async function handleCommit(req, res, id) {
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

    const commitment = await prisma.commitment.create({
      data: {
        projectId: project.id,
        takerId,
        status: 'PENDING_APPROVAL',
        stakeLocked: 0,
        committedAt: new Date()
      }
    });

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

// 3. POST /api/projects/:id/approve
async function handleApprove(req, res, id) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ownerId = parseSession(req);
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const { commitmentId } = req.body || {};

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

    if (commitment.taker.credits < project.stakeRequired) {
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

    const ghostDeadlineAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

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

// 4. POST /api/projects/:id/reject
async function handleReject(req, res, id) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ownerId = parseSession(req);
    if (!ownerId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const { commitmentId } = req.body || {};

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

// 5. GET /api/projects/:id/download
async function handleDownload(req, res, id) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = parseSession(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        commitments: {
          where: {
            status: { in: ['ACTIVE', 'SUBMITTED', 'COMPLETED'] }
          }
        }
      }
    });

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isOwner = project.ownerId === userId;
    const isApprovedTaker = project.commitments.some(c => c.takerId === userId);

    if (!isOwner && !isApprovedTaker) {
      return res.status(403).json({
        error: 'Code is locked in escrow. Only the project owner or approved taker may download the source code.'
      });
    }

    let fileBuffer;
    if (project.fileUrl && project.fileUrl.startsWith('/uploads/')) {
      const diskPath = path.join(process.cwd(), 'public', project.fileUrl);
      if (fs.existsSync(diskPath)) {
        fileBuffer = fs.readFileSync(diskPath);
      }
    }

    if (!fileBuffer) {
      const fileHeader = `=== PROJECT GRAVEYARD REPO ARCHIVE ===\n\n` +
        `Project Title: ${project.title}\n` +
        `Owner Alias: Anonymous (${project.ownerId})\n` +
        `Category: ${project.category}\n` +
        `Starting Completion: ${project.completion}%\n` +
        `Stake Locked: ${project.stakeRequired} credits\n` +
        `Timestamp: ${new Date().toISOString()}\n\n` +
        `--- OVERVIEW & SPECS ---\n${project.description}\n\n` +
        `--- REPO INSTRUCTIONS ---\n` +
        `1. Review remaining incomplete components.\n` +
        `2. Write implementation and tests.\n` +
        `3. Submit completed deliverable back to Project Graveyard before the 14-day timeout.\n`;

      fileBuffer = Buffer.from(fileHeader);
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${project.fileName || 'source.zip'}"`);
    return res.status(200).send(fileBuffer);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
