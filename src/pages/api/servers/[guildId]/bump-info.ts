import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const { guildId } = req.query;
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const client = await clientPromise;
  const db = client.db('discord');
  const bumps = db.collection('bumps');
  const lastBump = await bumps.findOne({ guildId, userId: session.user.id }, { sort: { bumpedAt: -1 } });
  if (lastBump) {
    const nextBump = new Date(new Date(lastBump.bumpedAt).getTime() + 2 * 60 * 60 * 1000);
    if (nextBump > new Date()) {
      return res.status(200).json({ nextBump });
    }
  }
  res.status(200).json({});
}