import prisma from '../../../lib/prisma';
import { parseSession, resolveDbUser } from '../../../lib/auth';
import { enrichProject, FALLBACK_PROJECTS } from '../../../lib/mockFallback';
import { analyzeGitHubRepository, parseGitHubRepositoryUrl } from '../../../lib/githubIntelligence';

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

      return res.status(200).json({ projects: filtered.map((p, idx) => enrichProject(p, idx)) });
    } catch (err) {
      console.warn('Database query failed or DATABASE_URL unconfigured; serving fallback projects:', err.message);
      const { search, category, status } = req.query || {};
      let filtered = [...FALLBACK_PROJECTS];
      if (category && category !== 'Any') {
        filtered = filtered.filter(p => p.category === category);
      }
      if (status && status !== 'Any') {
        filtered = filtered.filter(p => p.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return res.status(200).json({ projects: filtered.map((p, idx) => enrichProject(p, idx)) });
    }
  }

  if (req.method === 'POST') {
    try {
      const rawUserId = parseSession(req);
      if (!rawUserId) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
      }

      const user = await resolveDbUser(prisma, rawUserId);
      if (!user) return res.status(401).json({ error: 'User not found' });
      if (user.banned) {
        return res.status(403).json({ error: 'Your account is restricted due to ghost strikes (3+ strikes).' });
      }

      const userId = user.id;

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
        milestones = [],
        githubRepoUrl = ''
      } = req.body;

      if (!title || !description) {
        return res.status(400).json({ error: 'Title and description are required' });
      }

      if (githubRepoUrl && !parseGitHubRepositoryUrl(githubRepoUrl)) {
        return res.status(400).json({ error: 'GitHub repository URL must look like https://github.com/owner/repository' });
      }

      const initialAutopsy = {
        revivalScore: Math.floor(72 + Math.random() * 22),
        autopsyStatus: 'ABANDONED',
        autopsyCause: category === 'Campus Graveyard' || category === 'Education' ? 'graduation' : 'time-constraints',
        autopsyLastActivity: '3 months ago',
        autopsyDifficulty: Number(completion) > 60 ? 'Surface Dig' : Number(completion) > 30 ? 'Moderate Excavation' : 'Deep Excavation',
        peakActivityMonth: 'Sprint Alpha',
        peakActivityCommits: Math.floor(180 + Math.random() * 200),
        peakActivityContributors: Math.floor(2 + Math.random() * 3),
        peakActivityPullRequests: Math.floor(4 + Math.random() * 8)
      };

      let project = await prisma.project.create({
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
          githubRepoUrl: githubRepoUrl ? parseGitHubRepositoryUrl(githubRepoUrl).url : null,
          status: 'LISTED',
          ...initialAutopsy
        },
        include: {
          owner: {
            select: { id: true, alias: true, reputation: true, ghostStrikes: true, email: true }
          },
          commitments: true
        }
      });

      if (githubRepoUrl && process.env.GITHUB_TOKEN) {
        try {
          const intelligence = await analyzeGitHubRepository(githubRepoUrl);
          project = await prisma.project.update({
            where: { id: project.id },
            data: intelligence,
            include: {
              owner: {
                select: { id: true, alias: true, reputation: true, ghostStrikes: true, email: true }
              },
              commitments: true
            }
          });
        } catch (analysisError) {
          console.warn('Initial GitHub repository analysis skipped:', analysisError.message);
        }
      }

      return res.status(201).json({ project: enrichProject(project) });
    } catch (err) {
      console.error('Error creating project:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
