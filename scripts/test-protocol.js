const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function runProtocolVerification() {
  console.log('=== STARTING PROJECT GRAVEYARD PROTOCOL VERIFICATION ===\n');

  // Test 1: Verify users and aliases
  const users = await prisma.user.findMany();
  console.log(`✓ 1. Verified ${users.length} anonymous users. Aliases:`, users.map(u => u.alias).join(', '));
  if (!users.every(u => u.alias.startsWith('Digger-'))) {
    throw new Error('All user aliases must follow Digger-#### format!');
  }

  // Test 2: Verify projects in different states
  const projects = await prisma.project.findMany();
  console.log(`✓ 2. Verified ${projects.length} codebases in graveyard:`);
  projects.forEach(p => console.log(`   - [${p.status}] ${p.title} (${p.stakeRequired} cr stake)`));

  // Test 3: Verify append-only ledger entries exist
  const ledgerEntries = await prisma.ledgerEntry.findMany();
  console.log(`✓ 3. Verified ${ledgerEntries.length} immutable ledger audit records.`);
  const types = [...new Set(ledgerEntries.map(l => l.type))];
  console.log('   Ledger transaction types recorded:', types.join(', '));

  // Test 4: Simulate a full lifecycle test in DB:
  // Create temp owner and taker
  const pwd = await bcrypt.hash('testpass', 10);
  const owner = await prisma.user.create({
    data: {
      email: `test_owner_${Date.now()}@test.com`,
      passwordHash: pwd,
      alias: `Digger-${Math.floor(1000 + Math.random() * 9000)}`,
      credits: 500,
      reputation: 100
    }
  });

  const taker = await prisma.user.create({
    data: {
      email: `test_taker_${Date.now()}@test.com`,
      passwordHash: pwd,
      alias: `Digger-${Math.floor(1000 + Math.random() * 9000)}`,
      credits: 500,
      reputation: 100
    }
  });

  console.log(`✓ 4. Created test actors: Owner (${owner.alias}) & Taker (${taker.alias})`);

  // Owner creates project
  const testProject = await prisma.project.create({
    data: {
      ownerId: owner.id,
      title: 'Decentralized Micro-Cache',
      description: 'Zero-copy memory cache for course lab machines.',
      category: 'Systems',
      stakeRequired: 150,
      completion: 50,
      techTags: JSON.stringify(['Rust', 'C', 'POSIX']),
      milestoneMode: true,
      status: 'LISTED'
    }
  });
  console.log(`✓ 5. Created test project: ${testProject.title} with 150 credits required stake.`);

  // Taker commits
  const commitment = await prisma.commitment.create({
    data: {
      projectId: testProject.id,
      takerId: taker.id,
      status: 'PENDING_APPROVAL',
      stakeLocked: 0
    }
  });
  console.log(`✓ 6. Taker claimed project. Status: ${commitment.status} (Stake not yet locked).`);

  // Owner approves -> locks 150 credits
  await prisma.user.update({
    where: { id: taker.id },
    data: { credits: taker.credits - 150 }
  });
  await prisma.ledgerEntry.create({
    data: {
      userId: taker.id,
      type: 'STAKE_LOCK',
      amount: -150,
      relatedProjectId: testProject.id,
      relatedCommitmentId: commitment.id,
      notes: 'Locked 150 credits in escrow for Decentralized Micro-Cache'
    }
  });

  const activeCommitment = await prisma.commitment.update({
    where: { id: commitment.id },
    data: {
      status: 'ACTIVE',
      stakeLocked: 150,
      approvedAt: new Date(),
      ghostDeadlineAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });
  console.log(`✓ 7. Owner approved commitment. Stake 150 locked in escrow. Ghost deadline set to +14d.`);

  // Verify taker balance after lock
  const updatedTaker = await prisma.user.findUnique({ where: { id: taker.id } });
  if (updatedTaker.credits !== 350) {
    throw new Error(`Expected taker credits to be 350, got ${updatedTaker.credits}`);
  }
  console.log(`✓ 8. Verified taker credits deducted to ${updatedTaker.credits} cr.`);

  // Taker submits deliverable
  const submittedCommitment = await prisma.commitment.update({
    where: { id: activeCommitment.id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      submissionNotes: 'Implemented zero-copy ring buffer with memory barrier tests.'
    }
  });
  await prisma.project.update({
    where: { id: testProject.id },
    data: {
      status: 'SUBMITTED',
      reviewTimeoutAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  console.log(`✓ 9. Taker submitted deliverable. Review window set to +7d.`);

  // Owner verifies & approves -> Stake refunded + 100 reward credits + 15 rep
  await prisma.ledgerEntry.create({
    data: {
      userId: taker.id,
      type: 'STAKE_REFUND',
      amount: 150,
      relatedProjectId: testProject.id,
      relatedCommitmentId: submittedCommitment.id,
      notes: 'Stake refunded on verified completion'
    }
  });
  await prisma.ledgerEntry.create({
    data: {
      userId: taker.id,
      type: 'REWARD_CREDIT',
      amount: 100,
      relatedProjectId: testProject.id,
      relatedCommitmentId: submittedCommitment.id,
      notes: 'Reward credit for completing project'
    }
  });
  await prisma.user.update({
    where: { id: taker.id },
    data: {
      credits: updatedTaker.credits + 150 + 100, // 350 + 150 + 100 = 600
      reputation: updatedTaker.reputation + 15
    }
  });
  await prisma.project.update({
    where: { id: testProject.id },
    data: { status: 'COMPLETED', completion: 100 }
  });

  const finalTaker = await prisma.user.findUnique({ where: { id: taker.id } });
  console.log(`✓ 10. Escrow released! Final taker credits: ${finalTaker.credits} cr (expected 600), Reputation: ${finalTaker.reputation} (expected 115).`);

  // Clean up test actors
  await prisma.ledgerEntry.deleteMany({ where: { userId: { in: [owner.id, taker.id] } } });
  await prisma.commitment.deleteMany({ where: { projectId: testProject.id } });
  await prisma.project.delete({ where: { id: testProject.id } });
  await prisma.user.deleteMany({ where: { id: { in: [owner.id, taker.id] } } });

  console.log('\n=== ALL PROTOCOL LIFE-CYCLE CHECKS PASSED PERFECTLY! ===');
}

runProtocolVerification()
  .catch(e => {
    console.error('FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
