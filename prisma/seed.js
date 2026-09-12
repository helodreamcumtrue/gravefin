const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Project Graveyard database...');

  // Clear existing
  await prisma.milestone.deleteMany({});
  await prisma.ledgerEntry.deleteMany({});
  await prisma.commitment.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Users
  const user1 = await prisma.user.create({
    data: {
      email: 'owner@campus.edu',
      passwordHash,
      alias: 'Digger-1042',
      credits: 750,
      reputation: 120,
      ghostStrikes: 0,
      banned: false
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'taker@campus.edu',
      passwordHash,
      alias: 'Digger-2099',
      credits: 500, // 600 - 100 locked in project 3
      reputation: 115,
      ghostStrikes: 0,
      banned: false
    }
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'builder3@campus.edu',
      passwordHash,
      alias: 'Digger-3310',
      credits: 400,
      reputation: 95,
      ghostStrikes: 1,
      banned: false
    }
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'flakey@campus.edu',
      passwordHash,
      alias: 'Digger-5501',
      credits: 200,
      reputation: 60,
      ghostStrikes: 2,
      banned: false
    }
  });

  console.log('Created users:', [user1.alias, user2.alias, user3.alias, user4.alias]);

  // Initial ledger entries
  await prisma.ledgerEntry.createMany({
    data: [
      { userId: user1.id, type: 'REWARD_CREDIT', amount: 500, notes: 'Initial onboarding grant' },
      { userId: user1.id, type: 'REWARD_CREDIT', amount: 250, notes: 'Bonus credits for uploading verified projects' },
      { userId: user2.id, type: 'REWARD_CREDIT', amount: 500, notes: 'Initial onboarding grant' },
      { userId: user2.id, type: 'REWARD_CREDIT', amount: 100, notes: 'Previous project completion reward' },
      { userId: user3.id, type: 'REWARD_CREDIT', amount: 500, notes: 'Initial onboarding grant' },
      { userId: user3.id, type: 'GHOST_STRIKE', amount: 0, notes: 'Past milestone miss penalty (Rep: -10, Strikes: +1)' },
      { userId: user4.id, type: 'REWARD_CREDIT', amount: 500, notes: 'Initial onboarding grant' },
      { userId: user4.id, type: 'GHOST_STRIKE', amount: 0, notes: 'Past ghosting violation (Rep: -20, Strikes: +1)' },
      { userId: user4.id, type: 'GHOST_STRIKE', amount: 0, notes: 'Second ghosting violation (Rep: -20, Strikes: +1)' }
    ]
  });

  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // 2. Project 1: LISTED
  const p1 = await prisma.project.create({
    data: {
      ownerId: user1.id,
      title: 'AI Study Plan Generator',
      description: 'Generates adaptive study schedules from a course syllabus and calendar deadlines. Parser and difficulty heuristic are done; needs an intuitive dashboard, auth wiring, and export to iCal/Google Calendar.',
      category: 'AI/ML',
      techTags: JSON.stringify(['Python', 'FastAPI', 'React', 'SQLite']),
      stakeRequired: 120,
      completion: 65,
      milestoneMode: true,
      status: 'LISTED',
      fileName: 'ai_study_planner_v0.6.zip',
      fileUrl: '/downloads/ai_study_planner_v0.6.zip'
    }
  });

  // 3. Project 2: PENDING_APPROVAL
  const p2 = await prisma.project.create({
    data: {
      ownerId: user1.id,
      title: 'Campus Shuttle Live Tracker',
      description: 'Real-time shuttle bus tracker using MQTT and GPS beacons on campus loops. Socket bridge and map rendering are ready; ETA calculations and offline caching remain unfinished.',
      category: 'Web',
      techTags: JSON.stringify(['React', 'Node.js', 'WebSockets', 'Leaflet']),
      stakeRequired: 80,
      completion: 40,
      milestoneMode: false,
      status: 'PENDING_APPROVAL',
      fileName: 'campus_shuttle_tracker.zip'
    }
  });

  await prisma.commitment.create({
    data: {
      projectId: p2.id,
      takerId: user3.id,
      status: 'PENDING_APPROVAL',
      stakeLocked: 0,
      committedAt: new Date(now - 1 * dayMs)
    }
  });

  // 4. Project 3: ACTIVE with Taker Stake Locked
  const p3 = await prisma.project.create({
    data: {
      ownerId: user1.id,
      title: 'Local Grocery Co-op Platform',
      description: 'Community bulk food ordering platform with split cart checkout and neighborhood distribution spots. Cart splitting logic works; needs vendor invoicing and automated pickup notifications.',
      category: 'Web',
      techTags: JSON.stringify(['Next.js', 'Tailwind', 'PostgreSQL', 'Stripe Mock']),
      stakeRequired: 100,
      completion: 55,
      milestoneMode: true,
      status: 'ACTIVE',
      fileName: 'grocery_coop_platform.zip'
    }
  });

  const c3 = await prisma.commitment.create({
    data: {
      projectId: p3.id,
      takerId: user2.id,
      status: 'ACTIVE',
      stakeLocked: 100,
      committedAt: new Date(now - 4 * dayMs),
      approvedAt: new Date(now - 3 * dayMs),
      ghostDeadlineAt: new Date(now + 11 * dayMs) // 11 days remaining
    }
  });

  await prisma.ledgerEntry.create({
    data: {
      userId: user2.id,
      type: 'STAKE_LOCK',
      amount: -100,
      relatedProjectId: p3.id,
      relatedCommitmentId: c3.id,
      notes: 'Locked 100 credits stake in escrow for Local Grocery Co-op Platform'
    }
  });

  await prisma.milestone.createMany({
    data: [
      {
        commitmentId: c3.id,
        title: 'M1: Setup and database seed validation',
        dueAt: new Date(now - 1 * dayMs),
        status: 'MET'
      },
      {
        commitmentId: c3.id,
        title: 'M2: Vendor invoicing and order splitting',
        dueAt: new Date(now + 4 * dayMs),
        status: 'PENDING'
      },
      {
        commitmentId: c3.id,
        title: 'M3: Delivery notification worker & test suite',
        dueAt: new Date(now + 11 * dayMs),
        status: 'PENDING'
      }
    ]
  });

  // 5. Project 4: SUBMITTED (Awaiting Owner Review)
  const p4 = await prisma.project.create({
    data: {
      ownerId: user2.id,
      title: 'Edge Sensor IoT Environmental Monitor',
      description: 'Raspberry Pi Pico + sensor array reporting ambient temperature, humidity, and CO2 levels over local LoRa. Firmware and backend pipeline were done; needs frontend calibration widgets.',
      category: 'IoT',
      techTags: JSON.stringify(['Embedded C', 'Python', 'MQTT', 'Chart.js']),
      stakeRequired: 100,
      completion: 85,
      milestoneMode: false,
      status: 'SUBMITTED',
      reviewTimeoutAt: new Date(now + 5 * dayMs), // 5 days left to verify
      fileName: 'edge_sensor_iot.zip'
    }
  });

  await prisma.commitment.create({
    data: {
      projectId: p4.id,
      takerId: user3.id,
      status: 'SUBMITTED',
      stakeLocked: 100,
      committedAt: new Date(now - 10 * dayMs),
      approvedAt: new Date(now - 8 * dayMs),
      ghostDeadlineAt: new Date(now + 6 * dayMs),
      submittedAt: new Date(now - 2 * dayMs),
      submissionNotes: 'All calibration widgets implemented using Chart.js. Sensor mock added in test/mock_sensors.py. Verified readings update smoothly every 2s.',
      submissionUrl: '/downloads/edge_sensor_deliverable.zip'
    }
  });

  // 6. Project 5: COMPLETED
  const p5 = await prisma.project.create({
    data: {
      ownerId: user3.id,
      title: 'Minimalist Markdown Knowledge Base',
      description: 'Local-first hierarchical notes app with bidirectional linking and instant full-text search. Completed and verified by Digger-2099.',
      category: 'Web',
      techTags: JSON.stringify(['React', 'TypeScript', 'IndexedDB', 'WASM']),
      stakeRequired: 100,
      completion: 100,
      milestoneMode: false,
      status: 'COMPLETED',
      fileName: 'markdown_knowledge_base.zip'
    }
  });

  await prisma.commitment.create({
    data: {
      projectId: p5.id,
      takerId: user2.id,
      status: 'COMPLETED',
      stakeLocked: 0,
      committedAt: new Date(now - 20 * dayMs),
      approvedAt: new Date(now - 18 * dayMs),
      submittedAt: new Date(now - 6 * dayMs),
      resolvedAt: new Date(now - 4 * dayMs),
      submissionNotes: 'Full-text indexing with WASM SQLite completed. Bidirectional graph view integrated.'
    }
  });

  // 7. Project 6: LISTED
  await prisma.project.create({
    data: {
      ownerId: user2.id,
      title: 'Peer Tutoring Smart Matcher',
      description: 'Algorithmic matching system for university peer tutoring based on syllabus overlap and free time blocks. Solves scheduling conflicts without human coordination.',
      category: 'Web',
      techTags: JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'Redis']),
      stakeRequired: 90,
      completion: 30,
      milestoneMode: true,
      status: 'LISTED',
      fileName: 'peer_tutoring_matcher.zip'
    }
  });

  console.log('Database seeded successfully with 4 users and 6 projects!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
