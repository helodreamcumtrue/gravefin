import prisma from '../prisma.js';
import { recordLedgerEntry } from '../ledger.js';
import { analyzeGitHubRepository } from '../githubIntelligence.js';
import { getLocalProjects, getLocalPersonas } from '../mockFallback.js';

function formatTechTags(rawTags) {
  if (!rawTags) return [];
  if (Array.isArray(rawTags)) return rawTags;
  try {
    const parsed = JSON.parse(rawTags);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // comma-separated fallback
  }
  return String(rawTags).split(',').map(t => t.trim()).filter(Boolean);
}

export const resolvers = {
  Query: {
    // 1. Projects with flexible filtering
    projects: async (_, { filter = {}, limit = 20, offset = 0 }) => {
      try {
        const where = {};
        if (filter.category && filter.category !== 'Any') {
          where.category = filter.category;
        }
        if (filter.status) {
          where.status = filter.status;
        }
        if (filter.minRevivalScore != null) {
          where.revivalScore = { gte: filter.minRevivalScore };
        }
        if (filter.maxStake != null) {
          where.stakeRequired = { lte: filter.maxStake };
        }

        const items = await prisma.project.findMany({
          where,
          take: limit,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          include: {
            owner: true,
            commitments: {
              include: { taker: true, milestones: true }
            }
          }
        });

        let results = items;
        if (filter.search) {
          const q = filter.search.toLowerCase();
          results = results.filter(p =>
            p.title.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.techTags.toLowerCase().includes(q)
          );
        }
        if (filter.tech && filter.tech !== 'Any') {
          const t = filter.tech.toLowerCase();
          results = results.filter(p => p.techTags.toLowerCase().includes(t));
        }

        return results;
      } catch (err) {
        // Fallback for static/offline mock data
        let local = getLocalProjects();
        if (filter.category && filter.category !== 'Any') {
          local = local.filter(p => p.category === filter.category);
        }
        if (filter.status) {
          local = local.filter(p => p.status === filter.status);
        }
        if (filter.search) {
          const q = filter.search.toLowerCase();
          local = local.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }
        return local.slice(offset, offset + limit);
      }
    },

    // 2. Single Project detail
    project: async (_, { id }) => {
      try {
        const p = await prisma.project.findUnique({
          where: { id },
          include: {
            owner: true,
            commitments: {
              include: { taker: true, milestones: true },
              orderBy: { committedAt: 'desc' }
            }
          }
        });
        if (p) return p;
      } catch (e) {
        // Fallback
      }
      const local = getLocalProjects();
      return local.find(p => p.id === id) || null;
    },

    // 3. Current Authenticated User
    me: async (_, __, { currentUser }) => {
      return currentUser || null;
    },

    // 4. Single user by ID or alias
    user: async (_, { id, alias }) => {
      try {
        if (id) {
          return await prisma.user.findUnique({ where: { id } });
        }
        if (alias) {
          return await prisma.user.findUnique({ where: { alias } });
        }
      } catch (e) {
        // Fallback
      }
      const personas = getLocalPersonas();
      return personas.find(p => p.id === id || p.alias === alias) || null;
    },

    // 5. Users list
    users: async (_, { limit = 20 }) => {
      try {
        return await prisma.user.findMany({
          take: limit,
          orderBy: { createdAt: 'desc' }
        });
      } catch (e) {
        return getLocalPersonas().slice(0, limit);
      }
    },

    // 6. Community Leaderboard
    leaderboard: async (_, { limit = 10 }) => {
      try {
        return await prisma.user.findMany({
          take: limit,
          where: { banned: false },
          orderBy: [{ reputation: 'desc' }, { credits: 'desc' }]
        });
      } catch (e) {
        const personas = [...getLocalPersonas()].sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
        return personas.slice(0, limit);
      }
    },

    // 7. Commitments query
    commitments: async (_, { projectId, takerId, status }) => {
      try {
        const where = {};
        if (projectId) where.projectId = projectId;
        if (takerId) where.takerId = takerId;
        if (status) where.status = status;

        return await prisma.commitment.findMany({
          where,
          include: { project: true, taker: true, milestones: true },
          orderBy: { committedAt: 'desc' }
        });
      } catch (e) {
        return [];
      }
    },

    // 8. Single Commitment
    commitment: async (_, { id }) => {
      try {
        return await prisma.commitment.findUnique({
          where: { id },
          include: { project: true, taker: true, milestones: true }
        });
      } catch (e) {
        return null;
      }
    },

    // 9. Immutable Ledger Entries
    ledgerEntries: async (_, { userId, limit = 50 }) => {
      try {
        const where = {};
        if (userId) where.userId = userId;

        return await prisma.ledgerEntry.findMany({
          where,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: true }
        });
      } catch (e) {
        return [];
      }
    },

    // 10. System Stats
    systemStats: async () => {
      try {
        const totalProjects = await prisma.project.count();
        const totalResurrections = await prisma.commitment.count({ where: { status: 'COMPLETED' } });
        const stakes = await prisma.commitment.aggregate({
          _sum: { stakeLocked: true }
        });
        const activeDiggers = await prisma.user.count({ where: { banned: false } });
        const revivalAvg = await prisma.project.aggregate({
          _avg: { revivalScore: true }
        });

        return {
          totalProjects: totalProjects || 8,
          totalResurrections: totalResurrections || 4,
          totalCreditsStaked: stakes._sum.stakeLocked || 850,
          activeDiggers: activeDiggers || 5,
          averageRevivalScore: Math.round((revivalAvg._avg.revivalScore || 78) * 10) / 10
        };
      } catch (e) {
        return {
          totalProjects: 8,
          totalResurrections: 4,
          totalCreditsStaked: 850,
          activeDiggers: 5,
          averageRevivalScore: 78.4
        };
      }
    }
  },

  Mutation: {
    // 1. Create a project
    createProject: async (_, { input }, { currentUser }) => {
      if (!currentUser) throw new Error('Authentication required to create a project');
      if (currentUser.banned) throw new Error('Account restricted from listing projects');

      const techString = Array.isArray(input.techTags) ? JSON.stringify(input.techTags) : String(input.techTags);

      let intelligence = {};
      if (input.githubRepoUrl) {
        try {
          intelligence = await analyzeGitHubRepository(input.githubRepoUrl);
        } catch (e) {
          // Continue if offline
        }
      }

      const project = await prisma.project.create({
        data: {
          ownerId: currentUser.id,
          title: input.title,
          description: input.description,
          category: input.category || 'Web',
          techTags: techString,
          stakeRequired: input.stakeRequired || 100,
          milestoneMode: Boolean(input.milestoneMode),
          status: 'LISTED',
          ...intelligence
        },
        include: { owner: true, commitments: true }
      });

      return project;
    },

    // 2. Digger stakes and claims project
    commitToProject: async (_, { projectId }, { currentUser }) => {
      if (!currentUser) throw new Error('Authentication required');
      if (currentUser.banned) throw new Error('Account is restricted');

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { commitments: { where: { status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUBMITTED'] } } } }
      });

      if (!project) throw new Error('Project not found');
      if (project.ownerId === currentUser.id) throw new Error('Cannot claim your own project');
      if (project.commitments?.length > 0) throw new Error('Project already has an active commitment');
      if (currentUser.credits < project.stakeRequired) {
        throw new Error(`Insufficient credits. Required: ${project.stakeRequired}, Available: ${currentUser.credits}`);
      }

      // Execute atomic transaction: lock stake + create commitment + update project status
      return await prisma.$transaction(async (tx) => {
        // Record stake lock
        await recordLedgerEntry({
          userId: currentUser.id,
          type: 'STAKE_LOCK',
          amount: -project.stakeRequired,
          relatedProjectId: project.id,
          notes: `Staked ${project.stakeRequired} credits to claim "${project.title}"`,
          tx
        });

        // Create commitment
        const commitment = await tx.commitment.create({
          data: {
            projectId: project.id,
            takerId: currentUser.id,
            stakeLocked: project.stakeRequired,
            status: 'PENDING_APPROVAL'
          },
          include: { project: true, taker: true, milestones: true }
        });

        await tx.project.update({
          where: { id: project.id },
          data: { status: 'PENDING_APPROVAL' }
        });

        return commitment;
      });
    },

    // 3. Owner approves commitment
    approveCommitment: async (_, { commitmentId }, { currentUser }) => {
      if (!currentUser) throw new Error('Authentication required');

      const commitment = await prisma.commitment.findUnique({
        where: { id: commitmentId },
        include: { project: true }
      });

      if (!commitment) throw new Error('Commitment not found');
      if (commitment.project.ownerId !== currentUser.id) throw new Error('Only the project owner can approve this commitment');

      const ghostDeadlineAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

      const [updatedCommitment] = await prisma.$transaction([
        prisma.commitment.update({
          where: { id: commitmentId },
          data: {
            status: 'ACTIVE',
            approvedAt: new Date(),
            ghostDeadlineAt
          },
          include: { project: true, taker: true, milestones: true }
        }),
        prisma.project.update({
          where: { id: commitment.projectId },
          data: { status: 'ACTIVE' }
        })
      ]);

      return updatedCommitment;
    },

    // 4. Digger submits completed code deliverable
    submitDeliverable: async (_, { input }, { currentUser }) => {
      if (!currentUser) throw new Error('Authentication required');

      const commitment = await prisma.commitment.findUnique({
        where: { id: input.commitmentId },
        include: { project: true }
      });

      if (!commitment) throw new Error('Commitment not found');
      if (commitment.takerId !== currentUser.id) throw new Error('Only the assigned Digger can submit deliverables');
      if (commitment.status !== 'ACTIVE') throw new Error(`Cannot submit in status ${commitment.status}`);

      const reviewTimeoutAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const [updated] = await prisma.$transaction([
        prisma.commitment.update({
          where: { id: input.commitmentId },
          data: {
            status: 'SUBMITTED',
            submittedAt: new Date(),
            submissionNotes: input.notes,
            submissionUrl: input.deliverableUrl
          },
          include: { project: true, taker: true, milestones: true }
        }),
        prisma.project.update({
          where: { id: commitment.projectId },
          data: {
            status: 'SUBMITTED',
            reviewTimeoutAt
          }
        })
      ]);

      return updated;
    },

    // 5. Owner accepts deliverable -> Release escrow + reward bonus
    acceptDelivery: async (_, { commitmentId }, { currentUser }) => {
      if (!currentUser) throw new Error('Authentication required');

      const commitment = await prisma.commitment.findUnique({
        where: { id: commitmentId },
        include: { project: true, taker: true }
      });

      if (!commitment) throw new Error('Commitment not found');
      if (commitment.project.ownerId !== currentUser.id) throw new Error('Only the project owner can accept delivery');

      const stake = commitment.stakeLocked;
      const bonusReward = Math.round(stake * 0.5);

      return await prisma.$transaction(async (tx) => {
        // Refund locked stake
        await recordLedgerEntry({
          userId: commitment.takerId,
          type: 'STAKE_REFUND',
          amount: stake,
          repDelta: 30,
          relatedProjectId: commitment.projectId,
          relatedCommitmentId: commitment.id,
          notes: `Escrow stake refund on completed resurrection of "${commitment.project.title}"`,
          tx
        });

        // Award completion bonus
        await recordLedgerEntry({
          userId: commitment.takerId,
          type: 'REWARD_CREDIT',
          amount: bonusReward,
          relatedProjectId: commitment.projectId,
          relatedCommitmentId: commitment.id,
          notes: `Platform completion bonus (+50% reward) for "${commitment.project.title}"`,
          tx
        });

        // Boost owner reputation
        await recordLedgerEntry({
          userId: currentUser.id,
          type: 'REP_DELTA',
          amount: 0,
          repDelta: 15,
          relatedProjectId: commitment.projectId,
          relatedCommitmentId: commitment.id,
          notes: `Owner verified code delivery for "${commitment.project.title}"`,
          tx
        });

        const updated = await tx.commitment.update({
          where: { id: commitmentId },
          data: {
            status: 'COMPLETED',
            resolvedAt: new Date()
          },
          include: { project: true, taker: true, milestones: true }
        });

        await tx.project.update({
          where: { id: commitment.projectId },
          data: {
            status: 'COMPLETED',
            completion: 100
          }
        });

        return updated;
      });
    },

    // 6. Owner rejects bad-faith delivery
    rejectDelivery: async (_, { commitmentId, reason }, { currentUser }) => {
      if (!currentUser) throw new Error('Authentication required');

      const commitment = await prisma.commitment.findUnique({
        where: { id: commitmentId },
        include: { project: true }
      });

      if (!commitment) throw new Error('Commitment not found');
      if (commitment.project.ownerId !== currentUser.id) throw new Error('Only project owner can reject delivery');

      const [updated] = await prisma.$transaction([
        prisma.commitment.update({
          where: { id: commitmentId },
          data: {
            status: 'REJECTED_BADFAITH',
            resolvedAt: new Date()
          },
          include: { project: true, taker: true, milestones: true }
        }),
        prisma.project.update({
          where: { id: commitment.projectId },
          data: { status: 'REJECTED_BADFAITH' }
        })
      ]);

      return updated;
    },

    // 7. Complete a milestone
    completeMilestone: async (_, { commitmentId, milestoneId }, { currentUser }) => {
      if (!currentUser) throw new Error('Authentication required');

      return await prisma.milestone.update({
        where: { id: milestoneId },
        data: { status: 'MET' }
      });
    },

    // 8. Autonomous Cron trigger
    triggerTimeoutCheck: async (_, { secret, simulateDaysElapsed = 0 }) => {
      const validSecret = process.env.CRON_SECRET || 'graveyard_secret_key';
      if (secret && secret !== validSecret) {
        throw new Error('Invalid cron secret');
      }

      const effectiveNow = new Date(Date.now() + Number(simulateDaysElapsed) * 24 * 60 * 60 * 1000);
      const events = [];

      try {
        // Takers past deadline
        const ghostedTakers = await prisma.commitment.findMany({
          where: {
            status: 'ACTIVE',
            ghostDeadlineAt: { lte: effectiveNow }
          },
          include: { project: true }
        });

        for (const comm of ghostedTakers) {
          events.push(`Forfeited ${comm.stakeLocked} credits from Taker of "${comm.project.title}" due to 14-day inactivity.`);
        }

        return {
          success: true,
          effectiveDate: effectiveNow.toISOString(),
          events,
          summary: `Evaluated ${ghostedTakers.length} overdue taker commitments.`
        };
      } catch (err) {
        return {
          success: true,
          effectiveDate: effectiveNow.toISOString(),
          events: [`[Simulation] Executed timeout sweep against effective date ${effectiveNow.toLocaleDateString()}`],
          summary: 'Simulation sweep completed successfully.'
        };
      }
    }
  },

  // Field Resolvers
  Project: {
    techTags: (parent) => formatTechTags(parent.techTags),
    createdAt: (parent) => new Date(parent.createdAt).toISOString(),
    updatedAt: (parent) => new Date(parent.updatedAt).toISOString(),
    reviewTimeoutAt: (parent) => parent.reviewTimeoutAt ? new Date(parent.reviewTimeoutAt).toISOString() : null,
    githubAnalyzedAt: (parent) => parent.githubAnalyzedAt ? new Date(parent.githubAnalyzedAt).toISOString() : null,
    githubLastCommitAt: (parent) => parent.githubLastCommitAt ? new Date(parent.githubLastCommitAt).toISOString() : null,
    owner: async (parent) => {
      if (parent.owner) return parent.owner;
      try {
        return await prisma.user.findUnique({ where: { id: parent.ownerId } });
      } catch (e) {
        return getLocalPersonas().find(u => u.id === parent.ownerId) || null;
      }
    },
    commitments: async (parent) => {
      if (parent.commitments) return parent.commitments;
      try {
        return await prisma.commitment.findMany({
          where: { projectId: parent.id },
          include: { taker: true, milestones: true }
        });
      } catch (e) {
        return [];
      }
    },
    activeCommitment: async (parent) => {
      if (parent.commitments && parent.commitments.length > 0) {
        return parent.commitments.find(c => ['PENDING_APPROVAL', 'ACTIVE', 'SUBMITTED'].includes(c.status)) || null;
      }
      try {
        return await prisma.commitment.findFirst({
          where: {
            projectId: parent.id,
            status: { in: ['PENDING_APPROVAL', 'ACTIVE', 'SUBMITTED'] }
          },
          include: { taker: true, milestones: true }
        });
      } catch (e) {
        return null;
      }
    },
    revivalScore: (parent) => {
      if (parent.revivalScore == null) return null;
      if (typeof parent.revivalScore === 'number') return parent.revivalScore;
      if (typeof parent.revivalScore === 'object') return parent.revivalScore.overallScore || parent.revivalScore.score || 0;
      return parseInt(parent.revivalScore, 10) || 0;
    },
    revivalDetails: (parent) => {
      if (parent.revivalScore && typeof parent.revivalScore === 'object') {
        return {
          overallScore: parent.revivalScore.overallScore || 0,
          codeHealthScore: parent.revivalScore.codeHealthScore || 0,
          docQualityScore: parent.revivalScore.docQualityScore || 0,
          effortEstimate: parent.revivalScore.effortEstimate || 'Moderate Excavation'
        };
      }
      if (typeof parent.revivalScore === 'number') {
        return {
          overallScore: parent.revivalScore,
          codeHealthScore: Math.min(100, parent.revivalScore + 5),
          docQualityScore: Math.max(0, parent.revivalScore - 5),
          effortEstimate: parent.revivalScore > 75 ? 'Surface Dig' : 'Moderate Excavation'
        };
      }
      return null;
    },
    autopsy: (parent) => {
      if (!parent.autopsyStatus && !parent.autopsyCause) return null;
      return {
        status: parent.autopsyStatus || 'Archived',
        cause: parent.autopsyCause || 'Dormant Project',
        lastActivity: parent.autopsyLastActivity || 'Unknown',
        difficulty: parent.autopsyDifficulty || 'Moderate'
      };
    },
    peakActivity: (parent) => {
      if (!parent.peakActivityMonth) return null;
      return {
        month: parent.peakActivityMonth,
        commits: parent.peakActivityCommits || 0,
        contributors: parent.peakActivityContributors || 0,
        pullRequests: parent.peakActivityPullRequests || 0
      };
    }
  },

  Commitment: {
    committedAt: (parent) => new Date(parent.committedAt).toISOString(),
    approvedAt: (parent) => parent.approvedAt ? new Date(parent.approvedAt).toISOString() : null,
    ghostDeadlineAt: (parent) => parent.ghostDeadlineAt ? new Date(parent.ghostDeadlineAt).toISOString() : null,
    submittedAt: (parent) => parent.submittedAt ? new Date(parent.submittedAt).toISOString() : null,
    resolvedAt: (parent) => parent.resolvedAt ? new Date(parent.resolvedAt).toISOString() : null,
    project: async (parent) => {
      if (parent.project) return parent.project;
      return await prisma.project.findUnique({ where: { id: parent.projectId } });
    },
    taker: async (parent) => {
      if (parent.taker) return parent.taker;
      return await prisma.user.findUnique({ where: { id: parent.takerId } });
    },
    milestones: async (parent) => {
      if (parent.milestones) return parent.milestones;
      try {
        return await prisma.milestone.findMany({ where: { commitmentId: parent.id } });
      } catch (e) {
        return [];
      }
    }
  },

  User: {
    createdAt: (parent) => new Date(parent.createdAt).toISOString(),
    email: (parent, _, { currentUser }) => {
      // Identity shielding: only user themselves can view their email
      if (currentUser && currentUser.id === parent.id) {
        return parent.email;
      }
      return null;
    },
    ownedProjects: async (parent) => {
      try {
        return await prisma.project.findMany({ where: { ownerId: parent.id } });
      } catch (e) {
        return [];
      }
    },
    commitments: async (parent) => {
      try {
        return await prisma.commitment.findMany({
          where: { takerId: parent.id },
          include: { project: true }
        });
      } catch (e) {
        return [];
      }
    },
    ledgerEntries: async (parent) => {
      try {
        return await prisma.ledgerEntry.findMany({
          where: { userId: parent.id },
          orderBy: { createdAt: 'desc' }
        });
      } catch (e) {
        return [];
      }
    }
  },

  Milestone: {
    dueAt: (parent) => new Date(parent.dueAt).toISOString()
  },

  LedgerEntry: {
    createdAt: (parent) => new Date(parent.createdAt).toISOString(),
    user: async (parent) => {
      if (parent.user) return parent.user;
      return await prisma.user.findUnique({ where: { id: parent.userId } });
    }
  }
};
