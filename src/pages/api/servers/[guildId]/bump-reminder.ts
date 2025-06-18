import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
// Update the path below to the correct location of your [...nextauth] file.
// For example, if it is in 'src/pages/api/auth/[...nextauth].ts', use the following:
import { authOptions } from '../../auth/[...nextauth]';

// POST: set reminder, GET: get reminder status
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { guildId } = req.query;
  if (!guildId) return res.status(400).json({ error: 'Missing guildId' });
  const userId = session.user.id;
  const db = (await clientPromise).db('discord');
  const reminders = db.collection('bump_reminders');

  if (req.method === 'POST') {
    const { enabled } = req.body;
    await reminders.updateOne(
      { userId, guildId },
      { $set: { enabled: !!enabled, updatedAt: new Date() } },
      { upsert: true }
    );
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const doc = await reminders.findOne({ userId, guildId });
    return res.status(200).json({ enabled: !!doc?.enabled });
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
