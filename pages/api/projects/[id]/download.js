import fs from 'fs';
import path from 'path';
import prisma from '../../../../lib/prisma';
import { parseSession } from '../../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

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

    // Check if real uploaded file exists in public/
    let fileBuffer;
    if (project.fileUrl && project.fileUrl.startsWith('/uploads/')) {
      const diskPath = path.join(process.cwd(), 'public', project.fileUrl);
      if (fs.existsSync(diskPath)) {
        fileBuffer = fs.readFileSync(diskPath);
      }
    }

    if (!fileBuffer) {
      // Generate clean archive package content
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
