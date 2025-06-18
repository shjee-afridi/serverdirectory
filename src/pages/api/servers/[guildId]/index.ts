import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { rateLimit } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  let { guildId } = req.query;
  guildId = Array.isArray(guildId) ? guildId[0] : guildId;
  if (!guildId) return res.status(400).json({ error: 'Missing guildId' });

  const db = (await clientPromise).db('discord');
  const collection = db.collection('servers');

  // Only require session and block checks for mutating actions
  if (req.method === 'POST' || req.method === 'DELETE') {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const block = await db.collection('admin_blocks').findOne({ userId: session.user.id });
    // Check if user is a Discord admin of the guild
    let isGuildAdmin = false;
    if (session.accessToken) {
      try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (response.ok) {
          const guilds = await response.json();
          const ADMINISTRATOR = 0x00000008;
          const guild = guilds.find((g: any) => g.id === guildId.toString());
          if (guild && (guild.permissions & ADMINISTRATOR) === ADMINISTRATOR) {
            isGuildAdmin = true;
          }
        }
      } catch (e) { /* ignore */ }
    }
    // Block banned users from editing/deleting unless Discord admin
    if (!isGuildAdmin && block?.banned) {
      return res.status(403).json({ error: 'You are banned from this action.' });
    }
    if (block?.blockList || (block?.blockListOn && block.blockListOn[guildId])) {
      return res.status(403).json({ error: 'You are blocked from this action.' });
    }
    // --- Allow Discord server admins to edit/delete listing ---
    let isSiteAdmin = false;
    if (session.user?.email) {
      const { ADMIN_EMAILS } = await import('@/lib/isAdmin');
      isSiteAdmin = ADMIN_EMAILS.includes(session.user.email);
    }
    try {
      const discordRes = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://hentaidiscord.com'}/api/discord/guilds`,
        {
          headers: { Cookie: req.headers.cookie || '' },
        }
      );
      if (discordRes.ok) {
        const adminGuilds = await discordRes.json();
        isGuildAdmin = Array.isArray(adminGuilds) && adminGuilds.some((g: any) => g.id === String(guildId));
      }
    } catch (e) {
      // ignore Discord API errors, fallback to original lister check
    }
    const serverDoc = await collection.findOne({ guildId: String(guildId) });
    if (!isSiteAdmin && !isGuildAdmin && (!serverDoc || serverDoc.userId !== session.user.id)) {
      return res.status(403).json({ error: 'You are not allowed to edit this server. You must be a Discord server admin, the original lister, or a site admin.' });
    }
  }

  try {
    if (req.method === 'DELETE') {
      await collection.deleteOne({ guildId: guildId.toString() });
      return res.status(200).json({ success: true });
    }

    // GET: anyone can view
    const server = await collection.findOne({ guildId: guildId.toString() });
    if (!server) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(server);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}