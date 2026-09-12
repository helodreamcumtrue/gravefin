import prisma from '../../../../lib/prisma';
import { parseSession } from '../../../../lib/auth';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
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
        project,
        activeCommitment,
        userRole: isOwner ? 'OWNER' : isTaker ? 'TAKER' : 'GUEST'
      });
    } catch (err) {
      console.error('Error fetching project:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
