import type { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit } from '@/lib/rateLimit';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!rateLimit(req, res, { windowMs: 60_000, max: 20 })) return;
  const { guildId } = req.query;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!guildId) {
    return res.status(400).json({ error: 'Missing guildId' });
  }

  try {
    // Get guild info
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!guildRes.ok) {
      return res.status(guildRes.status).json({ error: 'Failed to fetch guild info' });
    }
    const guild = await guildRes.json();

    // Get channels to find a text channel for invite
    const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    const channels = await channelsRes.json();
    // Only select text channels where bot has CREATE_INSTANT_INVITE (0x20) permission
    const CREATE_INSTANT_INVITE = 0x00000020;
    const textChannel =
      channels.find((ch: any) => ch.type === 0 && ch.permissions && (parseInt(ch.permissions) & CREATE_INSTANT_INVITE)) ||
      channels.find((ch: any) => ch.type === 0);

    // Create invite
    let invite = null;
    let inviteError = null;
    let canPasteInvite = false;
    if (textChannel) {
      const inviteRes = await fetch(`https://discord.com/api/v10/channels/${textChannel.id}/invites`, {
        method: 'POST',
        headers: {
          Authorization: `Bot ${botToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          max_age: 0,
          max_uses: 0,
          unique: true,
        }),
      });
      if (inviteRes.ok) {
        invite = await inviteRes.json();
      } else {
        let errMsg = `Failed to create invite: ${inviteRes.status} ${inviteRes.statusText}`;
        try {
          const errJson = await inviteRes.json();
          if (errJson && errJson.message) {
            errMsg += ` - ${errJson.message}`;
            if (errJson.message.includes('Maximum number of invites')) {
              canPasteInvite = true;
            }
          }
        } catch {}
        inviteError = errMsg;
      }
    } else {
      inviteError = 'No suitable text channel found with CREATE_INSTANT_INVITE permission.';
      canPasteInvite = true;
    }

    // When sending the response, include canPasteInvite
    return res.status(200).json({
      ...guild,
      invite,
      inviteError,
      canPasteInvite,
      approximate_member_count: guild.approximate_member_count,
      approximate_presence_count: guild.approximate_presence_count,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch guild info or create invite' });
  }
}