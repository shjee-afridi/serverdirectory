import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { rateLimit } from '@/lib/rateLimit';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { isAdmin } from '@/lib/isAdmin';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;

  const { guildId } = req.query;
  const session = await getServerSession(req, res, authOptions);
  const isAdminUser = session && isAdmin(session.user);

  // If no guildId, only allow admin to fetch all reviews
  if (!guildId) {
    if (!isAdminUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const client = await clientPromise;
      const db = client.db('discord');
      const reviews = await db.collection('reviews').find({}).toArray();
      return res.status(200).json({ reviews });
    } catch (error) {
      return res.status(500).json({ error: 'Database error' });
    }
  }

  // If guildId is provided, allow public access to reviews for that server
  try {
    const client = await clientPromise;
    const db = client.db('discord');
    const reviews = await db.collection('reviews').find({ guildId: guildId.toString() }).toArray();
    return res.status(200).json({ reviews });
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
}