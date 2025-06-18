import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const client = await clientPromise;
  const db = client.db('discord');
  const collection = db.collection('servers');

  const { query, language } = req.query;
  if (!query) return res.status(400).json({ error: 'Missing query' });

  // Intelligent search: name, tags, description, case-insensitive, partial match
  const searchRegex = new RegExp(query.toString().split(/\s+/).join('|'), 'i');
  const mongoQuery: any = {
    $or: [
      { name: { $regex: searchRegex } },
      { tags: { $elemMatch: { $regex: searchRegex } } },
      { description: { $regex: searchRegex } },
      { shortDescription: { $regex: searchRegex } }
    ]
  };
  if (language && language !== 'All') {
    mongoQuery.language = { $regex: `^${language}$`, $options: 'i' };
  }

  const servers = await collection.find(mongoQuery).sort({ bumpedAt: -1, createdAt: -1 }).toArray();
  res.status(200).json(servers);
}