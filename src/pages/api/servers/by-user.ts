import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  try {
    const client = await clientPromise;
    const db = client.db('discord');
    const collection = db.collection('servers');
    const servers = await collection.find({ userId: userId.toString() }).toArray();
    res.status(200).json(servers);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}