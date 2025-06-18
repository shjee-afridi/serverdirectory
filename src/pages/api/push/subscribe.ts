import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) return res.status(400).json({ error: 'Invalid subscription' });
  // Optionally associate with user if session available
  // const session = await getServerSession(req, res, authOptions);
  try {
    const client = await clientPromise;
    const db = client.db('discord');
    await db.collection('push_subscriptions').updateOne(
      { endpoint: subscription.endpoint },
      { $set: { ...subscription, updatedAt: new Date() } },
      { upsert: true }
    );
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
}
