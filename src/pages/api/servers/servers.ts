import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { rateLimit } from '@/lib/rateLimit';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const client = await clientPromise;
  const db = client.db('discord');
  const collection = db.collection('servers');

  if (req.method === 'GET') {
    const { category } = req.query;
    let query = {};
    if (category) {
      // Normalize category for matching (trim, case-insensitive)
      const cat = category.toString().trim();
      // Debug log for incoming category
      console.log('API /servers: received category =', cat);
      query = {
        $or: [
          { categories: { $elemMatch: { $regex: `^${cat}$`, $options: 'i' } } }, // array exact
          { categories: { $regex: `(^|,| )${cat}(,| |$)`, $options: 'i' } }, // string contains
          { categories: { $regex: cat, $options: 'i' } }, // fallback partial
          { categories: cat }, // direct
        ]
      };
      // Debug log for query
      console.log('API /servers: mongo query =', JSON.stringify(query));
    }
    const servers = await collection.find(query).toArray();
    // Log categories for debugging
    console.log('--- Server categories for debugging ---');
    servers.forEach(s => console.log({ name: s.name, categories: s.categories }));
    return res.status(200).json(servers);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}