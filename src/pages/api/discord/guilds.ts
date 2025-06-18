import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const session = await getSession({ req });

  if (!session || !session.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const response = await fetch('https://discord.com/api/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch guilds' });
    }

    const guilds = await response.json();

    // Filter guilds where the user has ADMINISTRATOR permissions
    const adminGuilds = guilds.filter((guild: any) => {
      const ADMINISTRATOR = 0x00000008; // Bitmask for ADMINISTRATOR permission
      return (guild.permissions & ADMINISTRATOR) === ADMINISTRATOR;
    });

    res.status(200).json(adminGuilds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}