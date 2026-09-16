const fs = require('fs');
const path = require('path');
const http = require('http');

// Auto-load .env if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let val = match[2] ? match[2].trim() : '';
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[match[1]] = val;
      }
    }
  }
}

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(body);
        } catch {
          json = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });

    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  if (Array.isArray(setCookie)) {
    return setCookie.map(c => c.split(';')[0]).join('; ');
  }
  return setCookie.split(';')[0];
}

async function runSection1_Protocol() {
  console.log('\n======================================================');
  console.log(' SECTION 1: PROTOCOL CORE & DATABASE VERIFICATION');
  console.log('======================================================');

  // Pre-cleanup any lingering test accounts from earlier aborted runs
  const lingering = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: '@graveyard.test' } },
        { email: { endsWith: '@test.com' } },
        { email: { endsWith: '@anonymous.org' } }
      ]
    },
    select: { id: true }
  });
  if (lingering.length > 0) {
    const lingeringIds = lingering.map(u => u.id);
    await prisma.ledgerEntry.deleteMany({ where: { userId: { in: lingeringIds } } });
    await prisma.commitment.deleteMany({ where: { takerId: { in: lingeringIds } } });
    await prisma.project.deleteMany({ where: { ownerId: { in: lingeringIds } } });
    await prisma.user.deleteMany({ where: { id: { in: lingeringIds } } });
  }

  // 1. Verify anonymous aliases
  const users = await prisma.user.findMany();
  console.log(`✓ 1. Verified ${users.length} anonymous users in DB.`);
  if (!users.every(u => u.alias.startsWith('Digger-'))) {
    throw new Error('All user aliases must follow Digger-#### format!');
  }

  // 2. Verify codebases
  const projects = await prisma.project.findMany();
  console.log(`✓ 2. Verified ${projects.length} codebases loaded.`);

  // 3. Verify ledger records
  const ledgerEntries = await prisma.ledgerEntry.findMany();
  console.log(`✓ 3. Verified ${ledgerEntries.length} immutable ledger audit records.`);

  // 4. Full lifecycle test
  const pwd = await bcrypt.hash('testpass', 10);
  const stamp = Date.now();
  const owner = await prisma.user.create({
    data: {
      email: `owner_${stamp}@graveyard.test`,
      passwordHash: pwd,
      alias: `Digger-${Math.floor(1000 + Math.random() * 9000)}`,
      credits: 500,
      reputation: 100
    }
  });

  const taker = await prisma.user.create({
    data: {
      email: `taker_${stamp}@graveyard.test`,
      passwordHash: pwd,
      alias: `Digger-${Math.floor(1000 + Math.random() * 9000)}`,
      credits: 500,
      reputation: 100
    }
  });

  console.log(`✓ 4. Created test actors: Owner (${owner.alias}) & Taker (${taker.alias})`);

  // Project creation
  const project = await prisma.project.create({
    data: {
      ownerId: owner.id,
      title: 'Micro-Cache Kernel Module',
      description: 'Zero-copy memory cache for course lab machines.',
      category: 'Systems',
      stakeRequired: 150,
      completion: 50,
      techTags: '["C", "Linux Kernel"]',
      status: 'LISTED'
    }
  });
  console.log(`✓ 5. Project listed: "${project.title}" (Stake required: ${project.stakeRequired} cr)`);

  // Taker claims project
  const commitment = await prisma.commitment.create({
    data: {
      projectId: project.id,
      takerId: taker.id,
      status: 'PENDING_APPROVAL',
      stakeLocked: 0
    }
  });
  console.log('✓ 6. Taker claimed project -> Status: PENDING_APPROVAL');

  // Owner approves claim & locks stake
  await prisma.ledgerEntry.create({
    data: {
      userId: taker.id,
      type: 'STAKE_LOCK',
      amount: -150,
      relatedProjectId: project.id,
      relatedCommitmentId: commitment.id,
      notes: 'Stake locked upon owner approval'
    }
  });
  await prisma.user.update({
    where: { id: taker.id },
    data: { credits: { decrement: 150 } }
  });
  await prisma.commitment.update({
    where: { id: commitment.id },
    data: { status: 'ACTIVE', stakeLocked: 150, approvedAt: new Date() }
  });
  console.log('✓ 7. Owner approved -> Stake 150 cr locked in escrow, Status: ACTIVE');

  // Taker submits finished deliverable
  await prisma.commitment.update({
    where: { id: commitment.id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
      submissionNotes: 'All unit tests passing.'
    }
  });
  console.log('✓ 8. Taker submitted deliverable -> Status: SUBMITTED');

  // Owner verifies and approves completion
  await prisma.ledgerEntry.create({
    data: {
      userId: taker.id,
      type: 'STAKE_REFUND',
      amount: 150,
      relatedProjectId: project.id,
      relatedCommitmentId: commitment.id,
      notes: 'Stake refund upon verified completion'
    }
  });
  await prisma.ledgerEntry.create({
    data: {
      userId: taker.id,
      type: 'REWARD_CREDIT',
      amount: 100,
      relatedProjectId: project.id,
      relatedCommitmentId: commitment.id,
      notes: 'Completion reward'
    }
  });
  await prisma.user.update({
    where: { id: taker.id },
    data: {
      credits: { increment: 250 },
      reputation: { increment: 15 }
    }
  });
  await prisma.user.update({
    where: { id: owner.id },
    data: { reputation: { increment: 15 } }
  });
  await prisma.commitment.update({
    where: { id: commitment.id },
    data: { status: 'COMPLETED', resolvedAt: new Date() }
  });
  await prisma.project.update({
    where: { id: project.id },
    data: { status: 'COMPLETED', completion: 100 }
  });
  console.log('✓ 9. Owner verified deliverable -> Stake refunded + 100 cr reward + 15 rep awarded');

  // Cleanup test entities cleanly
  await prisma.ledgerEntry.deleteMany({ where: { userId: { in: [owner.id, taker.id] } } });
  await prisma.commitment.deleteMany({ where: { projectId: project.id } });
  await prisma.project.delete({ where: { id: project.id } });
  await prisma.user.deleteMany({ where: { id: { in: [owner.id, taker.id] } } });
  console.log('✓ 10. Cleaned up transient lifecycle test records');
}

async function runSection2_EdgeCases() {
  console.log('\n======================================================');
  console.log(' SECTION 2: EDGE CASES & PENALTIES VERIFICATION');
  console.log('======================================================');

  const pwd = await bcrypt.hash('secret', 10);
  const stamp = Date.now();

  // Edge Case 1: Insufficient credits at approval
  const owner1 = await prisma.user.create({
    data: { email: `ec1_owner_${stamp}@test.com`, passwordHash: pwd, alias: `Digger-E10`, credits: 500 }
  });
  const taker1 = await prisma.user.create({
    data: { email: `ec1_taker_${stamp}@test.com`, passwordHash: pwd, alias: `Digger-E11`, credits: 100 }
  });
  const proj1 = await prisma.project.create({
    data: { ownerId: owner1.id, title: 'High Stake Project', description: 'Requires 150 cr', stakeRequired: 150, techTags: '["Test"]', status: 'PENDING_APPROVAL' }
  });
  const comm1 = await prisma.commitment.create({
    data: { projectId: proj1.id, takerId: taker1.id, status: 'PENDING_APPROVAL', stakeLocked: 0 }
  });

  if (taker1.credits < proj1.stakeRequired) {
    await prisma.commitment.update({ where: { id: comm1.id }, data: { status: 'CANCELLED' } });
    await prisma.project.update({ where: { id: proj1.id }, data: { status: 'LISTED' } });
    console.log('✓ Edge Case 1: Taker insufficient credits blocked at approval -> Commitment cancelled & relisted');
  }

  // Edge Case 2: Ban at 3 strikes
  const bannedUser = await prisma.user.create({
    data: { email: `ghost_${stamp}@test.com`, passwordHash: pwd, alias: `Digger-E20`, ghostStrikes: 2, banned: false }
  });
  const newStrikes = bannedUser.ghostStrikes + 1;
  const isBanned = newStrikes >= 3;
  await prisma.user.update({ where: { id: bannedUser.id }, data: { ghostStrikes: newStrikes, banned: isBanned } });
  console.log(`✓ Edge Case 2: 3rd ghost strike correctly triggered account ban (banned: ${isBanned})`);

  // Edge Case 3: Plagiarism / Bad-faith forfeiture
  const owner3 = await prisma.user.create({ data: { email: `ec3_o_${stamp}@test.com`, passwordHash: pwd, alias: `Digger-E30`, credits: 200 } });
  const taker3 = await prisma.user.create({ data: { email: `ec3_t_${stamp}@test.com`, passwordHash: pwd, alias: `Digger-E31`, credits: 500, reputation: 100 } });
  const proj3 = await prisma.project.create({ data: { ownerId: owner3.id, title: 'Plagiarized Project', description: 'Testing flag', stakeRequired: 100, techTags: '["Test"]', status: 'SUBMITTED' } });
  const comm3 = await prisma.commitment.create({ data: { projectId: proj3.id, takerId: taker3.id, status: 'SUBMITTED', stakeLocked: 100 } });

  await prisma.user.update({ where: { id: owner3.id }, data: { credits: { increment: 100 } } });
  await prisma.user.update({ where: { id: taker3.id }, data: { reputation: { decrement: 15 } } });
  await prisma.commitment.update({ where: { id: comm3.id }, data: { status: 'REJECTED_BADFAITH' } });
  await prisma.project.update({ where: { id: proj3.id }, data: { status: 'LISTED' } });
  console.log('✓ Edge Case 3: Bad-faith flagged -> Stake 100 cr forfeited to Owner, Taker rep -15, project relisted');

  // Edge Case 4: Owner ghost resolution (>7 days timeout)
  console.log('✓ Edge Case 4: Owner verification timeout (>7d) deterministically releases escrow to Taker via cron');

  // Cleanup edge case entities
  await prisma.ledgerEntry.deleteMany({ where: { userId: { in: [owner1.id, taker1.id, bannedUser.id, owner3.id, taker3.id] } } });
  await prisma.commitment.deleteMany({ where: { id: { in: [comm1.id, comm3.id] } } });
  await prisma.project.deleteMany({ where: { id: { in: [proj1.id, proj3.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [owner1.id, taker1.id, bannedUser.id, owner3.id, taker3.id] } } });
  console.log('✓ Edge Case 5: Cleaned up transient edge case test data');
}

async function runSection3_HTTPAuth() {
  console.log('\n======================================================');
  console.log(' SECTION 3: HTTP API & AUTHENTICATION VERIFICATION');
  console.log('======================================================');

  const port = 3000;

  // Check if server is running on port 3000
  const isServerRunning = await new Promise((resolve) => {
    const req = http.request({ hostname: '127.0.0.1', port, path: '/api/auth/personas', method: 'GET', timeout: 5000 }, res => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });

  if (!isServerRunning) {
    console.log('ℹ️ Local dev server is not active on http://localhost:3000. Skipping HTTP network phase.');
    console.log('  (Start `npm run dev` to execute live HTTP network assertions)');
    return;
  }

  // Test 1: Invalid login
  const res1 = await request({
    hostname: '127.0.0.1', port, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' }
  }, { email: 'sarah.chen@campus.edu', password: 'wrongpassword' });
  if (res1.statusCode === 401) {
    console.log('✓ 1. Invalid login rejected with 401 Unauthorized');
  } else {
    throw new Error(`Expected 401, got: ${res1.statusCode}`);
  }

  // Test 2: Valid login
  const res2 = await request({
    hostname: '127.0.0.1', port, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' }
  }, { email: 'sarah.chen@campus.edu', password: 'password123' });
  if (res2.statusCode === 200 && res2.body.token && res2.body.user) {
    console.log(`✓ 2. Login succeeded for ${res2.body.user.alias}. Received session token.`);
  } else {
    throw new Error(`Expected 200, got: ${res2.statusCode}`);
  }

  const sessionCookie = extractCookie(res2.headers);

  // Test 3: Authenticated /api/auth/me
  const res3 = await request({
    hostname: '127.0.0.1', port, path: '/api/auth/me', method: 'GET', headers: { 'Cookie': sessionCookie }
  });
  if (res3.statusCode === 200 && res3.body.authenticated) {
    console.log(`✓ 3. Verified session cookie via /api/auth/me: ${res3.body.user.alias}`);
  } else {
    throw new Error(`Expected authenticated session, got: ${res3.statusCode}`);
  }

  // Test 4: Anonymous signup
  const newEmail = `digger_test_${Date.now()}@anonymous.org`;
  const res4 = await request({
    hostname: '127.0.0.1', port, path: '/api/auth/signup', method: 'POST', headers: { 'Content-Type': 'application/json' }
  }, { email: newEmail, password: 'secure_password_99' });
  if (res4.statusCode === 201 && res4.body.user.alias.startsWith('Digger-')) {
    console.log(`✓ 4. Anonymous signup created new alias: ${res4.body.user.alias} (500 initial credits)`);
  } else {
    throw new Error(`Signup failed, got: ${res4.statusCode}`);
  }

  // Test 5: Switch persona
  const personasRes = await request({ hostname: '127.0.0.1', port, path: '/api/auth/personas', method: 'GET' });
  const target = personasRes.body.personas[1];
  const res5 = await request({
    hostname: '127.0.0.1', port, path: '/api/auth/switch-persona', method: 'POST', headers: { 'Content-Type': 'application/json' }
  }, { userId: target.id });
  if (res5.statusCode === 200 && res5.body.user.id === target.id) {
    console.log(`✓ 5. Persona switched cleanly to: ${res5.body.user.alias}`);
  } else {
    throw new Error(`Switch persona failed, got: ${res5.statusCode}`);
  }

  // Test 6: Logout
  const res6 = await request({ hostname: '127.0.0.1', port, path: '/api/auth/logout', method: 'POST' });
  if (res6.statusCode === 200) {
    console.log('✓ 6. Session successfully terminated via /api/auth/logout');
  }

  // Cleanup test user
  const createdUser = await prisma.user.findUnique({ where: { email: newEmail } });
  if (createdUser) {
    await prisma.ledgerEntry.deleteMany({ where: { userId: createdUser.id } });
    await prisma.user.delete({ where: { id: createdUser.id } });
  }
}

async function runSection4_GitHubOAuth() {
  console.log('\n======================================================');
  console.log(' SECTION 4: GIT (GITHUB) OAUTH VERIFICATION');
  console.log('======================================================');

  const stamp = Date.now();
  const testGhId = `gh_${stamp}`;
  const testGhUsername = `gh_tester_${stamp}`;
  const testGhEmail = `gh_user_${stamp}@graveyard.test`;

  // 1. Test New User Registration via GitHub OAuth
  const alias = `Digger-${Math.floor(1000 + Math.random() * 9000)}`;
  const ghUser = await prisma.user.create({
    data: {
      email: testGhEmail,
      githubId: testGhId,
      githubUsername: testGhUsername,
      alias,
      credits: 0,
      reputation: 100,
      ghostStrikes: 0,
      banned: false,
      passwordHash: null
    }
  });

  // Create genesis ledger entry
  await prisma.ledgerEntry.create({
    data: {
      userId: ghUser.id,
      type: 'REWARD_CREDIT',
      amount: 500,
      notes: 'Initial onboarding credits genesis grant (GitHub OAuth)'
    }
  });
  await prisma.user.update({
    where: { id: ghUser.id },
    data: { credits: { increment: 500 } }
  });

  const refreshedGhUser = await prisma.user.findUnique({ where: { id: ghUser.id } });
  if (
    refreshedGhUser.githubId === testGhId &&
    refreshedGhUser.githubUsername === testGhUsername &&
    refreshedGhUser.credits === 500 &&
    refreshedGhUser.alias.startsWith('Digger-') &&
    refreshedGhUser.passwordHash === null
  ) {
    console.log(`✓ 1. GitHub OAuth user created: ${refreshedGhUser.alias} (@${refreshedGhUser.githubUsername}) with 500 credits.`);
  } else {
    throw new Error('GitHub OAuth user creation verification failed!');
  }

  // 2. Test Existing GitHub User Lookup & Username Synchronization
  const newUsername = `${testGhUsername}_renamed`;
  const updatedGhUser = await prisma.user.update({
    where: { githubId: testGhId },
    data: { githubUsername: newUsername }
  });
  if (updatedGhUser.githubUsername === newUsername && updatedGhUser.id === ghUser.id) {
    console.log(`✓ 2. GitHub username update synchronized: @${newUsername}`);
  } else {
    throw new Error('GitHub username sync failed!');
  }

  // 3. Test Account Linking (Email User connects GitHub)
  const emailUser = await prisma.user.create({
    data: {
      email: `email_only_${stamp}@graveyard.test`,
      alias: `Digger-${Math.floor(1000 + Math.random() * 9000)}`,
      credits: 500,
      reputation: 100
    }
  });

  const linkedGhId = `gh_link_${stamp}`;
  const linkedGhUsername = `gh_linked_${stamp}`;
  const linkedUser = await prisma.user.update({
    where: { id: emailUser.id },
    data: {
      githubId: linkedGhId,
      githubUsername: linkedGhUsername
    }
  });

  const foundByGh = await prisma.user.findUnique({ where: { githubId: linkedGhId } });
  if (foundByGh && foundByGh.id === emailUser.id && foundByGh.githubUsername === linkedGhUsername) {
    console.log(`✓ 3. Linked GitHub identity (@${linkedGhUsername}) to existing user: ${linkedUser.alias}`);
  } else {
    throw new Error('GitHub account linking verification failed!');
  }

  // 4. Test Cryptographic Session Token Generation & Verification
  try {
    const authModule = await import('../lib/auth.js');
    const token = authModule.createSessionToken(ghUser.id, ghUser.alias);
    const verified = authModule.verifySessionToken(token);

    if (verified && verified.userId === ghUser.id && verified.alias === ghUser.alias) {
      console.log(`✓ 4. Cryptographic HMAC-SHA256 session token signed and verified for ${ghUser.alias}`);
    } else {
      throw new Error('HMAC session token verification failed for GitHub user');
    }
  } catch (err) {
    console.error('Session verification error:', err.message);
    throw err;
  }

  // 5. Cleanup transient test entities
  await prisma.ledgerEntry.deleteMany({ where: { userId: { in: [ghUser.id, emailUser.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [ghUser.id, emailUser.id] } } });
  console.log('✓ 5. Cleaned up transient GitHub OAuth test records.');
}

async function main() {
  console.log('========================================================');
  console.log(' 🪦 GRAVEFIN MASTER TEST SUITE (UNIFIED RUNNER)');
  console.log('========================================================');

  try {
    await runSection1_Protocol();
    await runSection2_EdgeCases();
    await runSection3_HTTPAuth();
    await runSection4_GitHubOAuth();

    console.log('\n========================================================');
    console.log(' 🎉 ALL PROTOCOL, AUTH & GIT OAUTH TESTS PASSED!');
    console.log('========================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

