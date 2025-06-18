import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { isAdmin } from '@/lib/isAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST for safety
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session || !isAdmin(session.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const client = await clientPromise;
    const db = client.db('discord');
    const result = await db.collection('push_subscriptions').deleteMany({ endpoint: { $regex: '/fcm/send/' } });
    res.status(200).json({ deletedCount: result.deletedCount });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
}
