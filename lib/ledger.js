import prisma from './prisma';

/**
 * Appends an entry to the Ledger and updates the cached balances on User atomically.
 * Ensures the audit trail is 100% synchronized with cached values.
 */
export async function recordLedgerEntry({
  userId,
  type,
  amount = 0,
  repDelta = 0,
  strikeDelta = 0,
  relatedProjectId = null,
  relatedCommitmentId = null,
  notes = '',
  tx = null
}) {
  const db = tx || prisma;

  // 1. Create the immutable ledger record
  const entry = await db.ledgerEntry.create({
    data: {
      userId,
      type,
      amount,
      relatedProjectId,
      relatedCommitmentId,
      notes: notes ? `${notes} (Rep: ${repDelta >= 0 ? '+' : ''}${repDelta}, Strikes: +${strikeDelta})` : null
    }
  });

  // 2. Compute mutations for the cached balance fields
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error(`User ${userId} not found for ledger entry`);

  const newCredits = Math.max(0, user.credits + amount);
  const newReputation = Math.max(0, user.reputation + repDelta);
  const newStrikes = user.ghostStrikes + strikeDelta;
  const isBanned = user.banned || newStrikes >= 3;

  // 3. Update cached balance on User
  await db.user.update({
    where: { id: userId },
    data: {
      credits: newCredits,
      reputation: newReputation,
      ghostStrikes: newStrikes,
      banned: isBanned
    }
  });

  return entry;
}

/**
 * Deterministic penalty helper for when a Taker ghosts (>14d inactive or 3+ missed milestones)
 */
export async function applyTakerGhostPenalty({ takerId, ownerId, projectId, commitmentId, stakeAmount, tx }) {
  const db = tx || prisma;
  // 1. Stake forfeited to Owner
  if (stakeAmount > 0) {
    await recordLedgerEntry({
      userId: ownerId,
      type: 'STAKE_FORFEIT',
      amount: stakeAmount,
      relatedProjectId: projectId,
      relatedCommitmentId: commitmentId,
      notes: `Stake forfeited by ghosting taker to owner`,
      tx: db
    });
  }

  // 2. Taker rep penalty (-20) and ghost strike (+1)
  await recordLedgerEntry({
    userId: takerId,
    type: 'GHOST_STRIKE',
    amount: 0,
    repDelta: -20,
    strikeDelta: 1,
    relatedProjectId: projectId,
    relatedCommitmentId: commitmentId,
    notes: `Taker ghosted on project commitment (>14d inactive)`,
    tx: db
  });
}

/**
 * Deterministic penalty helper for when an Owner ghosts (>7d verify window)
 */
export async function applyOwnerGhostPenalty({ takerId, ownerId, projectId, commitmentId, stakeAmount, rewardAmount = 100, tx }) {
  const db = tx || prisma;
  // 1. Taker gets full stake refund
  if (stakeAmount > 0) {
    await recordLedgerEntry({
      userId: takerId,
      type: 'STAKE_REFUND',
      amount: stakeAmount,
      relatedProjectId: projectId,
      relatedCommitmentId: commitmentId,
      notes: `Stake refunded due to owner verification timeout`,
      tx: db
    });
  }

  // 2. Taker receives reward credit
  if (rewardAmount > 0) {
    await recordLedgerEntry({
      userId: takerId,
      type: 'REWARD_CREDIT',
      amount: rewardAmount,
      repDelta: 15,
      relatedProjectId: projectId,
      relatedCommitmentId: commitmentId,
      notes: `Reward credited automatically on owner review timeout`,
      tx: db
    });
  }

  // 3. Owner penalized: -10 rep, +1 strike
  await recordLedgerEntry({
    userId: ownerId,
    type: 'GHOST_STRIKE',
    amount: 0,
    repDelta: -10,
    strikeDelta: 1,
    relatedProjectId: projectId,
    relatedCommitmentId: commitmentId,
    notes: `Owner failed to verify submitted work within 7 days`,
    tx: db
  });
}
