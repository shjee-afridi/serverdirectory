import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import clientPromise from '@/lib/mongodb';
import { authOptions } from '../auth/[...nextauth]';
import { isAdmin } from '@/lib/isAdmin';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const session = await getServerSession(req, res, authOptions);
  if (!session || !isAdmin(session.user)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { userId, type, guildId, unblock } = req.body; // type: 'ban' | 'blockReview' | 'blockList' | 'blockReviewOnServer' | 'blockListOnServer'
  if (!userId || !type) return res.status(400).json({ error: 'Missing params' });

  // Debug logging to help diagnose why blocks are not being written
  console.log('BLOCK-USER API:', { userId, type, guildId, unblock });

  const client = await clientPromise;
  const db = client.db('discord');
  const adminBlocks = db.collection('admin_blocks');

  let update: any = {};
  if (unblock) {
    // Remove the block/ban
    if (type === 'ban') update = { banned: '' };
    if (type === 'blockReview') update = { blockReview: '' };
    if (type === 'blockList') update = { blockList: '' };
    if (type === 'blockReviewOnServer' && guildId) update = { [`blockReviewOn.${guildId}`]: '' };
    if (type === 'blockListOnServer' && guildId) update = { [`blockListOn.${guildId}`]: '' };
    if (type === 'blockGuildRelist' && guildId) {
      // Remove the global block for this guildId
      const result = await db.collection('admin_blocks').updateOne(
        { _id: "global" as any }, // Fix: allow string _id for global doc
        { $unset: { [`blockGuildRelist.${guildId}`]: "" } }
      );
      console.log('BLOCK-GUILD-RELIST UNSET RESULT:', result);
      return res.status(200).json({ success: true });
    }
    // Use $unset to remove the field
    const result = await adminBlocks.updateOne(
      { userId },
      { $unset: update }
    );
    console.log('BLOCK-USER UNSET RESULT:', result);
    return res.status(200).json({ success: true });
  }

  // Set the block/ban
  if (type === 'ban') update = { banned: true };
  if (type === 'blockReview') update = { blockReview: true };
  if (type === 'blockList') update = { blockList: true };
  if (type === 'blockReviewOnServer' && guildId) update = { [`blockReviewOn.${guildId}`]: true };
  if (type === 'blockListOnServer' && guildId) update = { [`blockListOn.${guildId}`]: true };
  if (type === 'blockGuildRelist' && guildId) {
    // Store a global block for this guildId (not per-user)
    const result = await db.collection('admin_blocks').updateOne(
      { _id: 'global' as any }, // Fix: allow string _id for global doc
      { $set: { [`blockGuildRelist.${guildId}`]: true } },
      { upsert: true }
    );
    console.log('BLOCK-GUILD-RELIST SET RESULT:', result);
    return res.status(200).json({ success: true });
  }

  const result = await adminBlocks.updateOne(
    { userId },
    { $set: update },
    { upsert: true }
  );
  console.log('BLOCK-USER SET RESULT:', result);

  res.status(200).json({ success: true });
}