import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { isAdmin } from '@/lib/isAdmin';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const session = await getServerSession(req, res, authOptions);
  if (!session || !isAdmin(session.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const client = await clientPromise;
    const db = client.db('discord');
    const users = await db.collection('users').find({}).toArray();
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}
