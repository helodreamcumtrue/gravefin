import prisma from '../../../lib/prisma';
import { parseSession, sanitizeUser } from '../../../lib/auth';

/**
 * Unified Users API Route Handler
 * Consolidates /api/users/me and /api/users/me/ledger
 * Matches:
 *  - GET /api/users/me
 *  - GET /api/users/me/ledger
 */
export default async function handler(req, res) {
  const { slug } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!slug || slug.length < 1) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  const resource = slug[0];
  const subAction = slug[1];

  if (resource === 'me') {
    if (!subAction) {
      return handleGetMe(req, res);
    }
    if (subAction === 'ledger') {
      return handleGetLedger(req, res);
    }
  }

  return res.status(404).json({ error: `User route '/api/users/${slug.join('/')}' not found` });
}

// 1. GET /api/users/me
async function handleGetMe(req, res) {
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

// 2. GET /api/users/me/ledger
async function handleGetLedger(req, res) {
  try {
    const userId = parseSession(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const ledger = await prisma.ledgerEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({ ledger });
  } catch (err) {
    console.error('Error fetching ledger:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
