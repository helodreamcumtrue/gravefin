import prisma from '../../../lib/prisma';
import { generateAlias, hashPassword, sanitizeUser } from '../../../lib/auth';
import { recordLedgerEntry } from '../../../lib/ledger';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Generate unique alias e.g. "Digger-4819"
    let alias = generateAlias();
    let aliasExists = await prisma.user.findUnique({ where: { alias } });
    while (aliasExists) {
      alias = generateAlias();
      aliasExists = await prisma.user.findUnique({ where: { alias } });
    }

    const passwordHash = await hashPassword(password);
    const initialCredits = 500;
    const initialReputation = 100;

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        alias,
        credits: initialCredits,
        reputation: initialReputation,
        ghostStrikes: 0,
        banned: false
      }
    });

    // Record signup credit grant in append-only ledger
    await recordLedgerEntry({
      userId: user.id,
      type: 'REWARD_CREDIT',
      amount: initialCredits,
      repDelta: 0,
      notes: 'Initial onboarding credits grant'
    });

    // Set simple cookie
    res.setHeader('Set-Cookie', `graveyard_user_id=${user.id}; Path=/; HttpOnly; SameSite=Lax`);

    return res.status(201).json({
      user: sanitizeUser(user, true)
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
