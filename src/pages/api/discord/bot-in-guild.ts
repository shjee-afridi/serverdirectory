import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const { guildId } = req.query;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId) {
    return res.status(400).json({ error: 'Missing guildId' });
  }

  try {
    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });
    const guilds = await response.json();
    const inGuild = guilds.some((guild: any) => guild.id === guildId);
    res.status(200).json({ inGuild });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check bot presence' });
  }
}