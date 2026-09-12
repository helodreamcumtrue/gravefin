import prisma from '../../../lib/prisma';
import { parseSession } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const { search, category, tech, status } = req.query;

      const where = {};

      if (category && category !== 'Any') {
        where.category = category;
      }

      if (status && status !== 'Any') {
        where.status = status;
      }

      const projects = await prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: { id: true, alias: true, reputation: true, ghostStrikes: true }
          },
          commitments: {
            where: {
              status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUBMITTED'] }
            },
            select: {
              id: true,
              status: true,
              taker: {
                select: { id: true, alias: true, reputation: true }
              },
              stakeLocked: true,
              ghostDeadlineAt: true
            }
          }
        }
      });

      // Filter in-memory for search query and tech tags
      let filtered = projects;
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.techTags.toLowerCase().includes(q)
        );
      }

      if (tech && tech !== 'Any') {
        filtered = filtered.filter(p =>
          p.techTags.toLowerCase().includes(tech.toLowerCase())
        );
      }

      return res.status(200).json({ projects: filtered });
    } catch (err) {
      console.error('Error listing projects:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'POST') {
    try {
      const userId = parseSession(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(401).json({ error: 'User not found' });
      if (user.banned) {
        return res.status(403).json({ error: 'Your account is restricted due to ghost strikes (3+ strikes).' });
      }

      const {
        title,
        description,
        stakeRequired = 100,
        techTags = '[]',
        category = 'Web',
        completion = 20,
        milestoneMode = false,
        fileName = 'project_archive.zip',
        fileUrl = '/downloads/source.zip',
        milestones = []
      } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }

      const project = await prisma.project.create({
        data: {
          ownerId: userId,
          title,
          description,
          stakeRequired: Number(stakeRequired),
          techTags: typeof techTags === 'string' ? techTags : JSON.stringify(techTags),
          category,
          completion: Number(completion),
          milestoneMode: Boolean(milestoneMode),
          fileName,
          fileUrl,
          status: 'LISTED'
        }
      });

      return res.status(201).json({ project });
    } catch (err) {
      console.error('Error creating project:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
