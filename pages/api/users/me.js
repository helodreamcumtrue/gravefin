import prisma from '../../../lib/prisma';
import { parseSession, sanitizeUser } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = parseSession(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedProjects: {
          orderBy: { createdAt: 'desc' },
          include: {
            commitments: {
              where: {
                status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUBMITTED', 'COMPLETED'] }
              },
              include: {
                taker: {
                  select: { id: true, alias: true, reputation: true, ghostStrikes: true }
                },
                milestones: true
              }
            }
          }
        },
        commitments: {
          orderBy: { committedAt: 'desc' },
          include: {
            project: {
              include: {
                owner: {
                  select: { id: true, alias: true, reputation: true }
                }
              }
            },
            milestones: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      user: sanitizeUser(user, true),
      ownedProjects: user.ownedProjects,
      commitments: user.commitments
    });
  } catch (err) {
    console.error('Error fetching current user:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
