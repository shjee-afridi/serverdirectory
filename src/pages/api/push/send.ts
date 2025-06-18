import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import webpush from 'web-push';

// Set your VAPID keys here
webpush.setVapidDetails(
  'mailto:admin@yourdomain.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { title, body, url } = req.body;
  if (!title || !body) return res.status(400).json({ error: 'Missing title or body' });
  try {
    const client = await clientPromise;
    const db = client.db('discord');
    const subs = await db.collection('push_subscriptions').find({}).toArray();
    console.log('Found subscriptions:', subs.length);
    const payload = JSON.stringify({ title, body, url });
    const results = await Promise.allSettled(
      subs.map(sub => webpush.sendNotification(sub, payload))
    );
    // Log failed notifications
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error('Push failed for sub', subs[i]?.endpoint, result.reason);
      }
    });
    res.status(200).json({ success: true, results });
  } catch (e) {
    console.error('Push send API error:', e);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
}
