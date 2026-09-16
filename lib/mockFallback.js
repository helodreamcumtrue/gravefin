// Fallback dataset and client-side demo persistence for GitHub Pages / Static Export mode

export const FALLBACK_PERSONAS = [
  {
    id: 'user-1',
    email: 'sarah.chen@campus.edu',
    alias: 'Digger-1042',
    credits: 850,
    reputation: 140,
    ghostStrikes: 0,
    banned: false
  },
  {
    id: 'user-2',
    email: 'alex.rivera@campus.edu',
    alias: 'Digger-2099',
    credits: 600,
    reputation: 125,
    ghostStrikes: 0,
    banned: false
  },
  {
    id: 'user-3',
    email: 'elena.rostova@campus.edu',
    alias: 'Digger-3310',
    credits: 450,
    reputation: 95,
    ghostStrikes: 1,
    banned: false
  },
  {
    id: 'user-4',
    email: 'marcus.vance@campus.edu',
    alias: 'Digger-5501',
    credits: 250,
    reputation: 60,
    ghostStrikes: 2,
    banned: false
  },
  {
    id: 'user-5',
    email: 'chloe.zhao@campus.edu',
    alias: 'Digger-7700',
    credits: 720,
    reputation: 130,
    ghostStrikes: 0,
    banned: false
  },
  {
    id: 'user-6',
    email: 'devbot@graveyard.fi',
    alias: 'Digger-9999',
    credits: 1000,
    reputation: 200,
    ghostStrikes: 0,
    banned: false
  }
];

export const FALLBACK_PROJECTS = [
  {
    id: 'p1',
    ownerId: 'user-1',
    owner: FALLBACK_PERSONAS[0],
    title: 'AI Adaptive Study Plan Generator',
    description: 'Generates personalized, high-yield study timetables by parsing course syllabi PDFs and canvas deadline feeds. Core parsing engine and heuristic difficulty scoring are complete; needs React calendar widget, user authentication, and export to iCal/Google Calendar.',
    category: 'AI/ML',
    techTags: JSON.stringify(['Python', 'FastAPI', 'React', 'SQLite', 'LangChain']),
    stakeRequired: 120,
    completion: 65,
    milestoneMode: true,
    status: 'LISTED',
    fileName: 'ai_study_planner_v0.6.zip',
    fileUrl: '/downloads/ai_study_planner_v0.6.zip',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    commitments: []
  },
  {
    id: 'p2',
    ownerId: 'user-1',
    owner: FALLBACK_PERSONAS[0],
    title: 'Campus Shuttle Live Radar & Dispatch',
    description: 'Real-time telemetry tracking for university campus loop shuttles. WebSocket server and Leaflet map rendering are functional; ETA prediction algorithms and offline driver reconnect logic are pending implementation.',
    category: 'Web',
    techTags: JSON.stringify(['React', 'Node.js', 'WebSockets', 'Leaflet', 'GeoJSON']),
    stakeRequired: 80,
    completion: 40,
    milestoneMode: false,
    status: 'PENDING_APPROVAL',
    fileName: 'campus_shuttle_tracker.zip',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    commitments: [
      {
        id: 'c2',
        projectId: 'p2',
        takerId: 'user-3',
        taker: FALLBACK_PERSONAS[2],
        status: 'PENDING_APPROVAL',
        stakeLocked: 0,
        committedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  },
  {
    id: 'p3',
    ownerId: 'user-1',
    owner: FALLBACK_PERSONAS[0],
    title: 'Local Grocery Co-op & Bulk Order Splitter',
    description: 'Community bulk organic food ordering platform featuring split carts and neighborhood pickup logistics. Shopping cart splitting logic works; needs vendor PDF invoice generation and automated SMS/email pickup alerts.',
    category: 'Web',
    techTags: JSON.stringify(['Next.js', 'Tailwind', 'PostgreSQL', 'Stripe Mock']),
    stakeRequired: 100,
    completion: 55,
    milestoneMode: true,
    status: 'ACTIVE',
    fileName: 'grocery_coop_platform.zip',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
    commitments: [
      {
        id: 'c3',
        projectId: 'p3',
        takerId: 'user-2',
        taker: FALLBACK_PERSONAS[1],
        status: 'ACTIVE',
        stakeLocked: 100,
        committedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        ghostDeadlineAt: new Date(Date.now() + 11 * 86400000).toISOString(),
        milestones: [
          { id: 'm1', title: 'M1: Setup database schema and mock vendor seeds', status: 'MET' },
          { id: 'm2', title: 'M2: PDF Invoice Generation with headless Chromium', status: 'PENDING' },
          { id: 'm3', title: 'M3: Delivery dispatch worker & webhook notifications', status: 'PENDING' }
        ]
      }
    ]
  },
  {
    id: 'p4',
    ownerId: 'user-2',
    owner: FALLBACK_PERSONAS[1],
    title: 'Edge Sensor IoT Environmental Monitor',
    description: 'Raspberry Pi Pico wireless sensor mesh reporting ambient temperature, particulate PM2.5, and CO2 levels over LoRa. Firmware and backend storage pipeline are built; needs frontend calibration dashboard and alerting threshold UI.',
    category: 'IoT',
    techTags: JSON.stringify(['Embedded C', 'Python', 'MQTT', 'Chart.js', 'Raspberry Pi']),
    stakeRequired: 100,
    completion: 85,
    milestoneMode: false,
    status: 'SUBMITTED',
    fileName: 'edge_sensor_iot.zip',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    commitments: [
      {
        id: 'c4',
        projectId: 'p4',
        takerId: 'user-3',
        taker: FALLBACK_PERSONAS[2],
        status: 'SUBMITTED',
        stakeLocked: 100,
        submittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        submissionNotes: 'Completed Chart.js sensor calibration widget, added LoRa node simulation runner, and verified live polling updates.',
        submissionUrl: '/downloads/edge_sensor_deliverable.zip'
      }
    ]
  },
  {
    id: 'p5',
    ownerId: 'user-3',
    owner: FALLBACK_PERSONAS[2],
    title: 'Minimalist Markdown Knowledge Base',
    description: 'Local-first hierarchical notes app featuring bidirectional wikilinks, graph visualization, and instant full-text client indexing. Successfully finished and verified by Digger-2099.',
    category: 'Web',
    techTags: JSON.stringify(['React', 'TypeScript', 'IndexedDB', 'WASM', 'D3.js']),
    stakeRequired: 100,
    completion: 100,
    milestoneMode: false,
    status: 'COMPLETED',
    fileName: 'markdown_knowledge_base.zip',
    createdAt: new Date(Date.now() - 22 * 86400000).toISOString(),
    commitments: [
      {
        id: 'c5',
        projectId: 'p5',
        takerId: 'user-2',
        taker: FALLBACK_PERSONAS[1],
        status: 'COMPLETED',
        stakeLocked: 0,
        submissionNotes: 'Implemented SQLite WASM full-text search index and interactive D3 node graph.'
      }
    ]
  },
  {
    id: 'p6',
    ownerId: 'user-1',
    owner: FALLBACK_PERSONAS[0],
    title: 'Solana DEX Arbitrage Speed Bot',
    description: 'High-frequency mempool scanner that detects price discrepancies across Raydium and Orca liquidity pools. Original taker ghosted after 14 days without communication. Code base unlocked and stake forfeited to community pool; ready for fresh revival.',
    category: 'Web3',
    techTags: JSON.stringify(['Rust', 'Solana Web3.js', 'Anchor', 'Node.js']),
    stakeRequired: 150,
    completion: 50,
    milestoneMode: true,
    status: 'GHOSTED_RELISTED',
    fileName: 'solana_dex_arbitrage.zip',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    commitments: []
  },
  {
    id: 'p7',
    ownerId: 'user-5',
    owner: FALLBACK_PERSONAS[4],
    title: 'WebAssembly Modular Audio Synth & DAW',
    description: 'In-browser modular polyphonic synthesizer with custom visual patch cords and oscilloscope spectrum analyzer. C++ DSP core compiles to WASM; needs Web Audio API worklet integration and MIDI keyboard event listeners.',
    category: 'DevTools',
    techTags: JSON.stringify(['C++', 'WebAssembly', 'Web Audio API', 'React', 'Canvas']),
    stakeRequired: 140,
    completion: 70,
    milestoneMode: true,
    status: 'LISTED',
    fileName: 'wasm_audio_synth.zip',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    commitments: []
  },
  {
    id: 'p8',
    ownerId: 'user-5',
    owner: FALLBACK_PERSONAS[4],
    title: 'Zero-Knowledge Identity Attestation Vault',
    description: 'Privacy-preserving credentials verification protocol using zk-SNARK circuits. Prover circuits and smart contract verifier are written; requires frontend QR scanning widget and proof generation loading states.',
    category: 'Security',
    techTags: JSON.stringify(['Circom', 'SnarkJS', 'Next.js', 'Solidity', 'Tailwind']),
    stakeRequired: 160,
    completion: 45,
    milestoneMode: true,
    status: 'LISTED',
    fileName: 'zk_identity_vault.zip',
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    commitments: []
  },
  {
    id: 'p9',
    ownerId: 'user-2',
    owner: FALLBACK_PERSONAS[1],
    title: 'Offline Peer-to-Peer Mesh Communicator',
    description: 'Disaster-zone messaging application communicating directly over Bluetooth Low Energy and Wi-Fi Direct mesh without cell towers or internet. Gossip protocol tested; needs message persistence and AES-256 ratcheting UI.',
    category: 'Mobile',
    techTags: JSON.stringify(['Flutter', 'BLE', 'Libp2p', 'Dart', 'Crypto']),
    stakeRequired: 110,
    completion: 35,
    milestoneMode: true,
    status: 'LISTED',
    fileName: 'mesh_communicator.zip',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    commitments: []
  },
  {
    id: 'p10',
    ownerId: 'user-1',
    owner: FALLBACK_PERSONAS[0],
    title: 'Git Repo Necromancy & Dependency Vulnerability Auditor',
    description: 'CLI toolkit that scans abandoned GitHub repositories, identifies critical CVEs, and automatically generates dependency upgrade PRs with green test builds. Core AST scanner works; needs Docker isolated sandbox execution.',
    category: 'DevTools',
    techTags: JSON.stringify(['Go', 'GitHub API', 'Docker', 'CLI', 'YAML']),
    stakeRequired: 90,
    completion: 80,
    milestoneMode: false,
    status: 'LISTED',
    fileName: 'git_necromancy_cli.zip',
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    commitments: []
  },
  {
    id: 'p11',
    ownerId: 'user-3',
    owner: FALLBACK_PERSONAS[2],
    title: 'Autonomous Lawn Rover Vision & Obstacle Classifier',
    description: 'Computer vision stack for budget autonomous lawn care rovers using single monocular RGB camera. Semantic segmentation model trained in PyTorch; needs ROS2 navigation node bridge and edge quantization for Jetson Nano.',
    category: 'AI/ML',
    techTags: JSON.stringify(['Python', 'PyTorch', 'OpenCV', 'ROS2', 'CUDA']),
    stakeRequired: 150,
    completion: 60,
    milestoneMode: true,
    status: 'LISTED',
    fileName: 'lawn_rover_vision.zip',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    commitments: []
  },
  {
    id: 'p12',
    ownerId: 'user-2',
    owner: FALLBACK_PERSONAS[1],
    title: 'Peer Tutoring Algorithmic Matcher',
    description: 'Algorithmic matching network for university peer study groups based on syllabus overlap, skill deficits, and mutual free calendar blocks. Matching algorithm done; needs messaging and rating feedback loop.',
    category: 'Web',
    techTags: JSON.stringify(['React', 'Node.js', 'PostgreSQL', 'Redis']),
    stakeRequired: 90,
    completion: 30,
    milestoneMode: false,
    status: 'LISTED',
    fileName: 'peer_tutoring_matcher.zip',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    commitments: []
  }
];

// Project metadata enrichment for Digital Graveyard features (Quadrant Map, Autopsy, Provenance)
export function enrichProject(project, index = 0) {
  const effortPresets = [25, 20, 45, 65, 30, 85, 60, 75, 50, 20, 70, 15];
  const potentialPresets = [88, 80, 75, 90, 95, 45, 85, 60, 40, 82, 70, 65];
  const districtPresets = [
    'AI Catacombs',
    'Campus Graveyard',
    'The Forgotten Web',
    'Infrastructure Crypt',
    'The Forgotten Web',
    'Cryptographic Catacombs',
    'DevTools Vault',
    'Cryptographic Catacombs',
    'Mobile Sanctuary',
    'DevTools Vault',
    'AI Catacombs',
    'Campus Graveyard'
  ];

  const effort = project.quadrantCoordinates?.effort ?? effortPresets[index % effortPresets.length];
  const potential = project.quadrantCoordinates?.potential ?? potentialPresets[index % potentialPresets.length];
  const district = project.district || districtPresets[index % districtPresets.length];
  const overallScore = project.revivalScore?.overallScore || potential;

  const autopsyReport = project.autopsyReport || {
    peakPeriod: index % 2 === 0 ? 'Q2 2024 (380 Commits)' : 'Hackathon Sprint (240 Commits)',
    declinePattern: index % 3 === 0 ? 'Academic Graduation' : index % 3 === 1 ? 'Maintainer Burnout' : 'Gradual Roll-off',
    ownerStatedReason:
      project.owner?.alias + ' and team moved on to senior thesis and industry jobs. The foundational architecture is solid.',
    dataCorrelationNote:
      'Zero fatal CVEs in dependencies; test coverage is at 72%. Ready for clean revival or modern framework update.',
    causeOfDeclineTags:
      district === 'Campus Graveyard'
        ? ['graduation', 'team-separation']
        : index % 2 === 0
        ? ['time-constraints', 'technical-debt']
        : ['funding', 'loss-of-interest'],
    recommendedRevivalPath:
      'Update dependencies to React 18 / Next.js 14, implement final UI widgets, and redeploy on serverless free tier.',
    activityTimeline: [
      { period: 'Period 1', commits: 120, contributors: 3 },
      { period: 'Period 2', commits: 340, contributors: 6, isPeak: true },
      { period: 'Period 3', commits: 90, contributors: 2 },
      { period: 'Period 4', commits: 25, contributors: 1 },
      { period: 'Recent', commits: 0, contributors: 0 }
    ]
  };

  const provenance = project.provenance || [
    {
      id: `prov_${project.id}_1`,
      hash: '0x' + Math.random().toString(16).substring(2, 12),
      timestamp: project.createdAt || new Date(Date.now() - 60 * 86400000).toISOString(),
      eventType: 'created',
      actorName: project.owner?.alias || 'Original Author',
      actorRole: 'Founder',
      note: 'Initial codebase commit & prototype deployment.'
    },
    {
      id: `prov_${project.id}_2`,
      hash: '0x' + Math.random().toString(16).substring(2, 12),
      timestamp: project.createdAt || new Date(Date.now() - 30 * 86400000).toISOString(),
      eventType: 'listed',
      actorName: project.owner?.alias || 'Curator',
      actorRole: 'Owner',
      note: 'Archived to Digital Graveyard with open escrow stake requirement.'
    }
  ];

  return {
    ...project,
    district,
    license: project.license || 'MIT',
    isForkFriendly: project.isForkFriendly ?? true,
    hasTornCorner: project.hasTornCorner ?? index % 2 === 0,
    lastActiveRecency: project.lastActiveRecency || '6 months ago',
    quadrantCoordinates: { effort, potential },
    revivalScore: {
      overallScore,
      codeHealthScore: 88,
      docQualityScore: 82,
      effortEstimate: effort < 35 ? 'Surface Dig' : effort < 65 ? 'Moderate Excavation' : 'Deep Excavation'
    },
    autopsyReport,
    provenance
  };
}

// Client-side storage helpers for static / GitHub Pages demo mode
export function getLocalProjects() {
  let list = FALLBACK_PROJECTS;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('graveyard_demo_projects');
      if (raw) list = JSON.parse(raw);
    } catch (e) {}
  }
  return list.map((p, idx) => enrichProject(p, idx));
}

export function saveLocalProjects(projects) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('graveyard_demo_projects', JSON.stringify(projects));
  } catch (e) {}
}

export function getLocalPersonas() {
  if (typeof window === 'undefined') return FALLBACK_PERSONAS;
  try {
    const raw = localStorage.getItem('graveyard_demo_personas');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return FALLBACK_PERSONAS;
}

export function saveLocalPersonas(personas) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('graveyard_demo_personas', JSON.stringify(personas));
  } catch (e) {}
}

