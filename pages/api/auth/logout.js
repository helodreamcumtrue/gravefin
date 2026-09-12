import { serializeClearCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clear both session cookie and legacy user id cookie
  res.setHeader('Set-Cookie', [
    serializeClearCookie(),
    'graveyard_user_id=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
  ]);

  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
}
