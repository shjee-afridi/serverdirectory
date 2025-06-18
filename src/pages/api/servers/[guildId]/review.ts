import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import { rateLimit } from '@/lib/rateLimit';
import { isAdmin } from '@/lib/isAdmin';

// Fix: Pass req and res as arguments
async function isUserInGuild(req: NextApiRequest, res: NextApiResponse, userId: string, guildId: string, accessToken: string) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const discordRes = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!discordRes.ok) return false;
  const guilds = await discordRes.json();
  return guilds.some((g: any) => g.id === guildId);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { guildId } = req.query;
  guildId = Array.isArray(guildId) ? guildId[0] : guildId;
  if (!guildId) return res.status(400).json({ error: 'Missing guildId' });

  const session = await getServerSession(req, res, authOptions);

  // Only require session for POST/DELETE
  if (req.method === 'POST' || req.method === 'DELETE') {
    if (!session || !session.user || !('id' in session.user) || !session.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const client = await clientPromise;
    const db = client.db('discord');
    const reviews = db.collection('reviews');

    const block = await db.collection('admin_blocks').findOne({ userId: session.user.id });
    if (req.method === 'POST') {
      if (block?.banned) {
        return res.status(403).json({ error: 'You are banned from this action.' });
      }
      // For reviews
      if (block?.blockReview) {
        return res.status(403).json({ error: 'You are blocked from reviewing.' });
      }
      if (block?.blockReviewOn && block.blockReviewOn[guildId]) {
        return res.status(403).json({ error: 'You are blocked from reviewing this server.' });
      }
      // For listings
      if (block?.blockList) {
        return res.status(403).json({ error: 'You are blocked from listing servers.' });
      }
      if (block?.blockListOn && block.blockListOn[guildId]) {
        return res.status(403).json({ error: 'You are blocked from listing this server.' });
      }
      const accessToken = session.accessToken as string;
      const userId = session.user.id as string;
      // Fix: Pass req and res to isUserInGuild
      const inGuild = await isUserInGuild(req, res, userId, guildId as string, accessToken);
      if (!inGuild) {
        return res.status(403).json({ error: 'You must join this Discord server before you can leave a review.' });
      }
      const { rating, comment } = req.body;
      await reviews.updateOne(
        { guildId, userId: session.user.id },
        {
          $set: {
            guildId,
            userId: session.user.id,
            username: session.user.name ?? '',
            avatar: session.user.image ?? '',
            rating,
            comment,
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      // --- Update average rating and review count ---
      const allReviews = await reviews.find({ guildId }).toArray();
      const avg = allReviews.length ? allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length : 0;
      const servers = db.collection('servers');
      await servers.updateOne(
        { guildId },
        { $set: { averageRating: avg, reviewCount: allReviews.length } }
      );
      return res.status(200).json({ success: true });
    }
    if (req.method === 'DELETE') {
      // Allow admin to delete any user's review
      let targetUserId = session.user.id;
      if (isAdmin(session.user) && req.body?.userId) {
        targetUserId = req.body.userId;
      }
      await reviews.deleteOne({ guildId, userId: targetUserId });
      // --- Update average rating and review count after delete ---
      const allReviews = await reviews.find({ guildId }).toArray();
      const avg = allReviews.length ? allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length : 0;
      const servers = db.collection('servers');
      await servers.updateOne(
        { guildId },
        { $set: { averageRating: avg, reviewCount: allReviews.length } }
      );
      return res.status(200).json({ success: true });
    }
  }

  // GET: allow public access to all reviews for the server
  if (req.method === 'GET') {
    const client = await clientPromise;
    const db = client.db('discord');
    const reviews = db.collection('reviews');
    const all = await reviews.find({ guildId }).toArray();
    if (session && session.user && session.user.id) {
      const mine = await reviews.findOne({ guildId, userId: session.user.id });
      return res.status(200).json({ all, mine });
    } else {
      return res.status(200).json({ all });
    }
  }

  res.setHeader('Allow', ['POST', 'DELETE', 'GET']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}