import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { rateLimit } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { guildId } = req.query;
  if (!guildId) return res.status(400).json({ error: 'Missing guildId' });
  const guildIdStr = Array.isArray(guildId) ? guildId[0] : guildId;

  const db = (await clientPromise).db('discord');
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
        const guild = guilds.find((g: any) => g.id === guildIdStr);
        if (guild && (guild.permissions & ADMINISTRATOR) === ADMINISTRATOR) {
          isGuildAdmin = true;
        }
      }
    } catch (e) { /* ignore */ }
  }

  if (!isGuildAdmin && (block?.banned || block?.blockList || (block?.blockListOn && block.blockListOn[guildIdStr]))) {
    return res.status(403).json({ error: 'You are blocked from this action.' });
  }

  // Check if this guild is globally blocked from being relisted
  const globalBlock = await db.collection('admin_blocks').findOne({ _id: 'global' as any });
  if (globalBlock?.blockGuildRelist && globalBlock.blockGuildRelist[guildIdStr]) {
    return res.status(403).json({ error: 'This server is blocked from being listed again by any admin.' });
  }
}