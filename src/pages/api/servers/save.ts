import clientPromise from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session || !session.accessToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { guildId, description, shortDescription, tags, link, language, categories, icon, banner, splash, name, colorTheme, widgetId, bannerMode } = req.body;

  if (!guildId || !description || !shortDescription || !categories || !language) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // --- Begin: Fetch latest guild info from Discord API to check banner and invite ---
  let finalBanner = banner;
  let finalSplash = splash;
  let finalInvite = link;
  try {
    const discordRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
      headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
    });
    if (discordRes.ok) {
      const guild = await discordRes.json();
      finalBanner = guild.banner || undefined;
      finalSplash = guild.splash || undefined;
    } else {
      finalBanner = banner;
      finalSplash = splash;
    }
    // --- Invite logic ---
    // If no invite or editing, check if invite is valid
    let inviteValid = false;
    if (finalInvite) {
      // Validate invite
      const inviteCode = finalInvite.match(/discord\.gg\/(\w+)|discord\.com\/invite\/(\w+)/);
      const code = inviteCode ? (inviteCode[1] || inviteCode[2]) : null;
      if (code) {
        const inviteRes = await fetch(`https://discord.com/api/v10/invites/${code}`, {
          headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
        });
        inviteValid = inviteRes.ok;
      }
    }
    if (!finalInvite || !inviteValid) {
      // Fetch channels to find a text channel for invite
      const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` },
      });
      const channels = await channelsRes.json();
      const CREATE_INSTANT_INVITE = 0x00000020;
      const textChannel =
        channels.find((ch: any) => ch.type === 0 && ch.permissions && (parseInt(ch.permissions) & CREATE_INSTANT_INVITE)) ||
        channels.find((ch: any) => ch.type === 0);
      if (textChannel) {
        const inviteRes = await fetch(`https://discord.com/api/v10/channels/${textChannel.id}/invites`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ max_age: 0, max_uses: 0, unique: true }),
        });
        if (inviteRes.ok) {
          const inviteData = await inviteRes.json();
          finalInvite = `https://discord.gg/${inviteData.code}`;
        }
      }
    }
    // --- End Invite logic ---
  } catch (e) {
    finalBanner = banner;
    finalSplash = splash;
  }
  // --- End: Fetch latest guild info from Discord API to check banner and invite ---

  // Ensure finalInvite is always a string URL if it's an object
  if (finalInvite && typeof finalInvite === 'object' && finalInvite.code) {
    finalInvite = `https://discord.gg/${finalInvite.code}`;
  }

  try {
    const client = await clientPromise;
    const db = client.db('discord');
    const collection = db.collection('servers');

    const block = await db.collection('admin_blocks').findOne({ userId: session.user.id });

    // Check if user is a Discord admin of the guild
    let isGuildAdmin = false;
    if (session.accessToken) {
      try {
        const response = await fetch('https://discord.com/api/users/@me/guilds', {
          headers: { Authorization: `Bearer ${session.accessToken}` },
        });
        if (response.ok) {
          const guilds = await response.json();
          const ADMINISTRATOR = 0x00000008;
          const guild = guilds.find((g: any) => g.id === guildId.toString());
          if (guild && (guild.permissions & ADMINISTRATOR) === ADMINISTRATOR) {
            isGuildAdmin = true;
          }
        }
      } catch (e) { /* ignore */ }
    }

    // Block banned users from listing or editing servers (unless they are Discord admin of the guild)
    if (!isGuildAdmin && block?.banned) {
      return res.status(403).json({ error: 'You are banned from this action.' });
    }
    // For listings
    if (!isGuildAdmin && block?.blockList) {
      return res.status(403).json({ error: 'You are blocked from listing servers.' });
    }
    if (!isGuildAdmin && block?.blockListOn && block.blockListOn[guildId]) {
      return res.status(403).json({ error: 'You are blocked from listing this server.' });
    }

    // Check if this guild is globally blocked from being relisted    
    const globalBlock = await db.collection('admin_blocks').findOne({ _id: 'global' as any });
    if (globalBlock?.blockGuildRelist && globalBlock.blockGuildRelist[guildId]) {
      return res.status(403).json({ error: 'This server is blocked from being listed again by any admin.' });
    }

    await collection.updateOne(
      { guildId: guildId.toString() },
      {
        $set: {
          guildId,
          description,
          shortDescription,
          categories,
          tags,
          link: finalInvite, // always store valid invite
          language,
          icon,
          banner: finalBanner, // use checked banner from Discord API
          splash: finalSplash, // keep splash in sync too
          name,
          colorTheme,
          widgetId,
          bannerMode: bannerMode || 'banner', // <-- persist bannerMode
          userId: (session.user as { id?: string | null })?.id || null,
          email: session.user?.email || null,
          username: session.user?.name || null,
          updatedAt: new Date(), // always update
        },
        $setOnInsert: {
          createdAt: new Date(), // only set on first insert
        },
      },
      { upsert: true }
    );

    res.status(200).json({ message: 'Server description saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}