import { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';
import { rateLimit } from '@/lib/rateLimit';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;

  const client = await clientPromise;
  const db = client.db('discord');
  const collection = db.collection('servers');

  const { category, language, sort, page = 1, perPage = 10, minMembers, tags } = req.query;

  let query: any = {};
  if (category && category !== 'All') {
    // Match any category in the array, case-insensitive
    query.categories = { $regex: category, $options: 'i' };
  }
  if (language && language !== 'All') {
    query.language = { $regex: `^${language}$`, $options: 'i' };
  }
  if (minMembers) {
    query.approximate_member_count = { $gte: Number(minMembers) };
  }
  if (tags) {
    query.tags = { $all: Array.isArray(tags) ? tags : [tags] };
  }

  let sortObj: any = {};
  if (sort === 'recent') sortObj.createdAt = -1;
  else if (sort === 'bumped') sortObj.bumpedAt = -1;
  else if (sort === 'mostBumped') sortObj['stats.bump'] = -1;
  else if (sort === 'mostReviewed') sortObj['stats.reviewCount'] = -1;
  else if (sort === 'mostViewed') sortObj['stats.visit'] = -1;
  else sortObj.bumpedAt = -1;

  const skip = (Number(page) - 1) * Number(perPage);

  // Always include banner, splash, and icon in the projection
  const projection = {
    banner: 1,
    splash: 1,
    icon: 1,
    guildId: 1,
    name: 1,
    shortDescription: 1,
    colorTheme: 1,
    categories: 1,
    tags: 1,
    language: 1,
    averageRating: 1,
    reviewCount: 1,
    // add any other fields you want to show in the card
  };

  // When fetching servers, use the projection
  const servers = await collection
    .find(query)
    .project(projection)
    .sort(sortObj)
    .skip(skip)
    .limit(Number(perPage))
    .toArray();

  res.status(200).json({ servers, total: await collection.countDocuments(query) });
}