import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const { guildId } = req.query;
  if (!guildId) return res.status(400).json({ error: 'Missing guildId' });

  const client = await clientPromise;
  const db = client.db('discord');
  const stats = db.collection('server_stats');
  const visitLogs = db.collection('server_visit_logs');

  if (req.method === 'POST') {
    const { type } = req.body;
    // Use userId if available, otherwise fallback to IP
    let userId = null;
    if (req.headers.cookie) {
      // If you use NextAuth, you can parse the session cookie to get userId
      // For simplicity, let's use IP for now unless you add logic to extract userId
    }
    const ip =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket?.remoteAddress ||
      'unknown';
    const now = new Date();

    if (type === 'visit') {
      // Only count a visit from the same user/IP once per 24h
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const lastVisit = await visitLogs.findOne({
        guildId: guildId.toString(),
        ip,
        type: 'visit',
      });
      if (!lastVisit || now.getTime() - new Date(lastVisit.lastVisit).getTime() > twentyFourHours) {
        await stats.updateOne(
          { guildId: guildId.toString() },
          { $inc: { visit: 1 } },
          { upsert: true }
        );
        await visitLogs.updateOne(
          { guildId: guildId.toString(), ip, type: 'visit' },
          { $set: { lastVisit: now } },
          { upsert: true }
        );
        return res.status(200).json({ success: true, counted: true });
      } else {
        return res.status(200).json({ success: true, counted: false });
      }
    }

    if (type === 'copy') {
      // Only count a copy from the same user/IP once per 24h
      const twentyFourHours = 24 * 60 * 60 * 1000;
      const lastCopy = await visitLogs.findOne({
        guildId: guildId.toString(),
        ip,
        type: 'copy',
      });
      if (!lastCopy || now.getTime() - new Date(lastCopy.lastCopy).getTime() > twentyFourHours) {
        await stats.updateOne(
          { guildId: guildId.toString() },
          { $inc: { copy: 1 } },
          { upsert: true }
        );
        await visitLogs.updateOne(
          { guildId: guildId.toString(), ip, type: 'copy' },
          { $set: { lastCopy: now } },
          { upsert: true }
        );
        return res.status(200).json({ success: true, counted: true });
      } else {
        return res.status(200).json({ success: true, counted: false });
      }
    }

    if (type === 'join') {
      // Only count a join from the same user/IP once ever
      const alreadyJoined = await visitLogs.findOne({
        guildId: guildId.toString(),
        ip,
        type: 'join',
      });
      if (!alreadyJoined) {
        await stats.updateOne(
          { guildId: guildId.toString() },
          { $inc: { join: 1 } },
          { upsert: true }
        );
        await visitLogs.insertOne({
          guildId: guildId.toString(),
          ip,
          type: 'join',
          joinedAt: now,
        });
        return res.status(200).json({ success: true, counted: true });
      } else {
        return res.status(200).json({ success: true, counted: false });
      }
    }

    // For other types, just increment without deduplication
    await stats.updateOne(
      { guildId: guildId.toString() },
      { $inc: { [type]: 1 } },
      { upsert: true }
    );
    return res.status(200).json({ success: true });
  }

  if (req.method === 'GET') {
    const data = await stats.findOne({ guildId: guildId.toString() });
    return res.status(200).json(data || { visit: 0, copy: 0, join: 0, bump: 0 });
  }

  res.setHeader('Allow', ['POST', 'GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}