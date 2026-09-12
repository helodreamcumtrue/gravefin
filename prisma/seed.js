const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding rich production demo dataset into Neon PostgreSQL...');

  // 1. Wipe existing test records cleanly
  await prisma.milestone.deleteMany({});
  await prisma.ledgerEntry.deleteMany({});
  await prisma.commitment.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash('password123', 10);
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  // 2. Create 6 distinct test personas
  const user1 = await prisma.user.create({
    data: {
      email: 'sarah.chen@campus.edu',
      passwordHash,
      alias: 'Digger-1042', // Sarah Chen: Verified Repo Founder
      credits: 850,
      reputation: 140,
      ghostStrikes: 0,
      banned: false
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'alex.rivera@campus.edu',
      passwordHash,
      alias: 'Digger-2099', // Alex Rivera: Active Bounty Hunter
      credits: 600,
      reputation: 125,
      ghostStrikes: 0,
      banned: false
    }
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'elena.rostova@campus.edu',
      passwordHash,
      alias: 'Digger-3310', // Elena Rostova: AI/ML specialist
      credits: 450,
      reputation: 95,
      ghostStrikes: 1,
      banned: false
    }
  });

  const user4 = await prisma.user.create({
    data: {
      email: 'marcus.vance@campus.edu',
      passwordHash,
      alias: 'Digger-5501', // Marcus Vance: High Risk, 2 Strikes
      credits: 250,
      reputation: 60,
      ghostStrikes: 2,
      banned: false
    }
  });

  const user5 = await prisma.user.create({
    data: {
      email: 'chloe.zhao@campus.edu',
      passwordHash,
      alias: 'Digger-7700', // Chloe Zhao: Web3 & Rust Pro
      credits: 720,
      reputation: 130,
      ghostStrikes: 0,
      banned: false
    }
  });

  const user6 = await prisma.user.create({
    data: {
      email: 'devbot@graveyard.fi',
      passwordHash,
      alias: 'Digger-9999', // DevBot Sentinel: Simulation Persona
      credits: 1000,
      reputation: 200,
      ghostStrikes: 0,
      banned: false
    }
  });

  console.log('Created 6 personas:', [user1.alias, user2.alias, user3.alias, user4.alias, user5.alias, user6.alias]);

  // 3. Create initial ledger history
  await prisma.ledgerEntry.createMany({
    data: [
      { userId: user1.id, type: 'REWARD_CREDIT', amount: 500, notes: 'Initial onboarding genesis grant' },
      { userId: user1.id, type: 'REWARD_CREDIT', amount: 350, notes: 'Platform bonus: Listed 4 high-demand dead repositories' },
      { userId: user2.id, type: 'REWARD_CREDIT', amount: 500, notes: 'Initial onboarding genesis grant' },
      { userId: user2.id, type: 'REWARD_CREDIT', amount: 200, notes: 'Verified deliverable reward for Markdown KB' },
      { userId: user2.id, type: 'STAKE_LOCK', amount: -100, notes: 'Escrow lock for Local Grocery Co-op stake' },
      { userId: user3.id, type: 'REWARD_CREDIT', amount: 500, notes: 'Initial onboarding genesis grant' },
      { userId: user3.id, type: 'GHOST_STRIKE', amount: 0, notes: 'Missed M3 milestone in past season (Rep -10, Strikes +1)' },
      { userId: user4.id, type: 'REWARD_CREDIT', amount: 500, notes: 'Initial onboarding genesis grant' },
      { userId: user4.id, type: 'STAKE_FORFEIT', amount: -150, notes: 'Ghosted Solana DEX speed bot (14d timeout expired, Rep -20, Strikes +1)' },
      { userId: user4.id, type: 'STAKE_FORFEIT', amount: -100, notes: 'Failed second commitment without notice (Rep -20, Strikes +1)' },
      { userId: user5.id, type: 'REWARD_CREDIT', amount: 500, notes: 'Initial onboarding genesis grant' },
      { userId: user5.id, type: 'REWARD_CREDIT', amount: 220, notes: 'Open source contribution multiplier reward' },
      { userId: user6.id, type: 'REWARD_CREDIT', amount: 1000, notes: 'Platform genesis reserve liquidity allocation' }
    ]
  });

  // 4. Seed 12 Detailed Projects spanning all states & tech stacks

  // Project 1: LISTED - AI/ML
  const p1 = await prisma.project.create({
    data: {
      ownerId: user1.id,
      title: 'AI Adaptive Study Plan Generator',
      description: 'Generates personalized, high-yield study timetables by parsing course syllabi PDFs and canvas deadline feeds. Core parsing engine and heuristic difficulty scoring are complete; needs React calendar widget, user authentication, and export to iCal/Google Calendar.',
      category: 'AI/ML',
      techTags: JSON.stringify(['Python', 'FastAPI', 'React', 'SQLite', 'LangChain']),
      stakeRequired: 120,
      completion: 65,
      milestoneMode: true,
      status: 'LISTED',
      fileName: 'ai_study_planner_v0.6.zip',
      fileUrl: '/downloads/ai_study_planner_v0.6.zip'
    }
  });

  // Project 2: PENDING_APPROVAL - Web
  const p2 = await prisma.project.create({
    data: {
      ownerId: user1.id,
      title: 'Campus Shuttle Live Radar & Dispatch',
      description: 'Real-time telemetry tracking for university campus loop shuttles. WebSocket server and Leaflet map rendering are functional; ETA prediction algorithms and offline driver reconnect logic are pending implementation.',
      category: 'Web',
      techTags: JSON.stringify(['React', 'Node.js', 'WebSockets', 'Leaflet', 'GeoJSON']),
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

  // Project 3: ACTIVE - Web with Escrow Stakes & Milestones
  const p3 = await prisma.project.create({
    data: {
      ownerId: user1.id,
      title: 'Local Grocery Co-op & Bulk Order Splitter',
      description: 'Community bulk organic food ordering platform featuring split carts and neighborhood pickup logistics. Shopping cart splitting logic works; needs vendor PDF invoice generation and automated SMS/email pickup alerts.',
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
      ghostDeadlineAt: new Date(now + 11 * dayMs)
    }
  });

  await prisma.milestone.createMany({
    data: [
      {
        commitmentId: c3.id,
        title: 'M1: Setup database schema and mock vendor seeds',
        dueAt: new Date(now - 1 * dayMs),
        status: 'MET'
      },
      {
        commitmentId: c3.id,
        title: 'M2: PDF Invoice Generation with headless Chromium',
        dueAt: new Date(now + 4 * dayMs),
        status: 'PENDING'
      },
      {
        commitmentId: c3.id,
        title: 'M3: Delivery dispatch worker & webhook notifications',
        dueAt: new Date(now + 11 * dayMs),
        status: 'PENDING'
      }
    ]
  });

  // Project 4: SUBMITTED - IoT (Pending Owner Verification)
  const p4 = await prisma.project.create({
    data: {
      ownerId: user2.id,
      title: 'Edge Sensor IoT Environmental Monitor',
      description: 'Raspberry Pi Pico wireless sensor mesh reporting ambient temperature, particulate PM2.5, and CO2 levels over LoRa. Firmware and backend storage pipeline are built; needs frontend calibration dashboard and alerting threshold UI.',
      category: 'IoT',
      techTags: JSON.stringify(['Embedded C', 'Python', 'MQTT', 'Chart.js', 'Raspberry Pi']),
      stakeRequired: 100,
      completion: 85,
      milestoneMode: false,
      status: 'SUBMITTED',
      reviewTimeoutAt: new Date(now + 5 * dayMs),
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
      submissionNotes: 'Completed Chart.js sensor calibration widget, added LoRa node simulation runner under /tests/lora_sim.py, and verified live polling updates smoothly every 2s.',
      submissionUrl: '/downloads/edge_sensor_deliverable.zip'
    }
  });

  // Project 5: COMPLETED - Web
  const p5 = await prisma.project.create({
    data: {
      ownerId: user3.id,
      title: 'Minimalist Markdown Knowledge Base',
      description: 'Local-first hierarchical notes app featuring bidirectional wikilinks, graph visualization, and instant full-text client indexing. Successfully finished and verified by Digger-2099.',
      category: 'Web',
      techTags: JSON.stringify(['React', 'TypeScript', 'IndexedDB', 'WASM', 'D3.js']),
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
      submissionNotes: 'Implemented SQLite WASM full-text search index and interactive D3 node graph. Added zero-latency local storage sync.'
    }
  });

  // Project 6: GHOSTED_RELISTED - Web3
  const p6 = await prisma.project.create({
    data: {
      ownerId: user1.id,
      title: 'Solana DEX Arbitrage Speed Bot',
      description: 'High-frequency mempool scanner that detects price discrepancies across Raydium and Orca liquidity pools. Original taker ghosted after 14 days without communication. Code base unlocked and stake forfeited to community pool; ready for fresh revival.',
      category: 'Web3',
      techTags: JSON.stringify(['Rust', 'Solana Web3.js', 'Anchor', 'Node.js']),
      stakeRequired: 150,
      completion: 50,
      milestoneMode: true,
      status: 'GHOSTED_RELISTED',
      fileName: 'solana_dex_arbitrage.zip'
    }
  });

  await prisma.commitment.create({
    data: {
      projectId: p6.id,
      takerId: user4.id,
      status: 'GHOSTED',
      stakeLocked: 0,
      committedAt: new Date(now - 30 * dayMs),
      approvedAt: new Date(now - 28 * dayMs),
      resolvedAt: new Date(now - 14 * dayMs),
      submissionNotes: 'Taker exceeded 14-day zero-activity threshold. Automatic protocol timeout triggered and 150 stake forfeited.'
    }
  });

  // Project 7: LISTED - DevTools / Audio
  await prisma.project.create({
    data: {
      ownerId: user5.id,
      title: 'WebAssembly Modular Audio Synth & DAW',
      description: 'In-browser modular polyphonic synthesizer with custom visual patch cords and oscilloscope spectrum analyzer. C++ DSP core compiles to WASM; needs Web Audio API worklet integration and MIDI keyboard event listeners.',
      category: 'DevTools',
      techTags: JSON.stringify(['C++', 'WebAssembly', 'Web Audio API', 'React', 'Canvas']),
      stakeRequired: 140,
      completion: 70,
      milestoneMode: true,
      status: 'LISTED',
      fileName: 'wasm_audio_synth.zip'
    }
  });

  // Project 8: LISTED - Security / Web3
  await prisma.project.create({
    data: {
      ownerId: user5.id,
      title: 'Zero-Knowledge Identity Attestation Vault',
      description: 'Privacy-preserving credentials verification protocol using zk-SNARK circuits. Prover circuits and smart contract verifier are written; requires frontend QR scanning widget and proof generation loading states.',
      category: 'Security',
      techTags: JSON.stringify(['Circom', 'SnarkJS', 'Next.js', 'Solidity', 'Tailwind']),
      stakeRequired: 160,
      completion: 45,
      milestoneMode: true,
      status: 'LISTED',
      fileName: 'zk_identity_vault.zip'
    }
  });

  // Project 9: LISTED - Mobile / Networking
  await prisma.project.create({
    data: {
      ownerId: user2.id,
      title: 'Offline Peer-to-Peer Mesh Communicator',
      description: 'Disaster-zone messaging application communicating directly over Bluetooth Low Energy and Wi-Fi Direct mesh without cell towers or internet. Gossip protocol tested; needs message persistence and AES-256 ratcheting UI.',
      category: 'Mobile',
      techTags: JSON.stringify(['Flutter', 'BLE', 'Libp2p', 'Dart', 'Crypto']),
      stakeRequired: 110,
      completion: 35,
      milestoneMode: true,
      status: 'LISTED',
      fileName: 'mesh_communicator.zip'
    }
  });

  // Project 10: LISTED - DevTools
  await prisma.project.create({
    data: {
      ownerId: user1.id,
      title: 'Git Repo Necromancy & Dependency Vulnerability Auditor',
      description: 'CLI toolkit that scans abandoned GitHub repositories, identifies critical CVEs, and automatically generates dependency upgrade PRs with green test builds. Core AST scanner works; needs Docker isolated sandbox execution.',
      category: 'DevTools',
      techTags: JSON.stringify(['Go', 'GitHub API', 'Docker', 'CLI', 'YAML']),
      stakeRequired: 90,
      completion: 80,
      milestoneMode: false,
      status: 'LISTED',
      fileName: 'git_necromancy_cli.zip'
    }
  });

  // Project 11: LISTED - AI/Robotics
  await prisma.project.create({
    data: {
      ownerId: user3.id,
      title: 'Autonomous Lawn Rover Vision & Obstacle Classifier',
      description: 'Computer vision stack for budget autonomous lawn care rovers using single monocular RGB camera. Semantic segmentation model trained in PyTorch; needs ROS2 navigation node bridge and edge quantization for Jetson Nano.',
      category: 'AI/ML',
      techTags: JSON.stringify(['Python', 'PyTorch', 'OpenCV', 'ROS2', 'CUDA']),
      stakeRequired: 150,
      completion: 60,
      milestoneMode: true,
      status: 'LISTED',
      fileName: 'lawn_rover_vision.zip'
    }
  });

  // Project 12: LISTED - Web
  await prisma.project.create({
    data: {
      ownerId: user2.id,
      title: 'Peer Tutoring Algorithmic Matcher',
      description: 'Algorithmic matching network for university peer study groups based on syllabus overlap, skill deficits, and mutual free calendar blocks. Matching algorithm done; needs messaging and rating feedback loop.',
      category: 'Web',
      techTags: JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'Redis']),
      stakeRequired: 90,
      completion: 30,
      milestoneMode: false,
      status: 'LISTED',
      fileName: 'peer_tutoring_matcher.zip'
    }
  });

  console.log('✅ Successfully seeded 6 personas and 12 diverse repositories into Neon PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
