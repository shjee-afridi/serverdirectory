import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { rateLimit } from '@/lib/rateLimit';

async function isUserInGuild(userId: string, guildId: string, accessToken: string) {
  const res = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) return false;
  const guilds = await res.json();
  return guilds.some((g: any) => g.id === guildId);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  if (req.method !== 'POST') return res.status(405).end();

  const { guildId } = req.query;
  if (!guildId || Array.isArray(guildId)) {
    return res.status(400).json({ error: 'Invalid guildId' });
  }
  const guildIdStr = guildId.toString();

  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id || !session.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const client = await clientPromise;
  const db = client.db('discord');
  const bumps = db.collection('bumps');
  const servers = db.collection('servers');

  // Check if user is in the server
  const inGuild = await isUserInGuild(session.user.id, guildIdStr, session.accessToken as string);
  if (!inGuild) {
    return res.status(403).json({ error: 'You must be a member of this server to bump.' });
  }

  // Check cooldown
  const lastBump = await bumps.findOne({ guildId: guildIdStr, userId: session.user.id }, { sort: { bumpedAt: -1 } });
  const now = new Date();
  if (lastBump && now.getTime() - new Date(lastBump.bumpedAt).getTime() < 2 * 60 * 60 * 1000) {
    const nextBump = new Date(new Date(lastBump.bumpedAt).getTime() + 2 * 60 * 60 * 1000);
    return res.status(429).json({ error: 'Cooldown', nextBump });
  }

  // Record the bump
  await bumps.insertOne({ guildId: guildIdStr, userId: session.user.id, bumpedAt: now });

  // Update server's bumpedAt
  await servers.updateOne({ guildId: guildIdStr }, { $set: { bumpedAt: now } });

  // After updating server's bumpedAt
  await db.collection('server_stats').updateOne(
    { guildId: guildIdStr },
    { $inc: { bump: 1 } },
    { upsert: true }
  );

  // Create or update bump reminder for this user/server
  const reminders = db.collection('bump_reminders');
  const remindAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
  await reminders.updateOne(
    { userId: session.user.id, guildId: guildIdStr },
    { $set: { enabled: true, remindAt } },
    { upsert: true }
  );

  return res.status(200).json({ success: true, bumpedAt: now });
}