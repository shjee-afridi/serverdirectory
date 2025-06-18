require('dotenv').config({ path: '.env.local' });

const { Client, GatewayIntentBits, Partials, SlashCommandBuilder, Routes, PermissionFlagsBits } = require('discord.js');
const { MongoClient } = require('mongodb');
const { REST } = require('@discordjs/rest');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages], partials: [Partials.Channel] });

const mongoUri = process.env.MONGODB_URI;
let db;

async function connectMongo() {
  if (!db) {
    const mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    db = mongoClient.db('discord');
  }
  return db;
}

// Register slash commands
async function registerCommands() {
  const commands = [
    new SlashCommandBuilder()
      .setName('setadchannel')
      .setDescription('Set the channel for cross-advertising ads')
      .addChannelOption(option =>
        option.setName('channel')
          .setDescription('Channel to post ads in')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('enablecrossad')
      .setDescription('Enable or disable cross-advertising for this server')
      .addBooleanOption(option =>
        option.setName('enabled')
          .setDescription('Enable or disable cross-advertising')
          .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('bump')
      .setDescription('Send your server ad to all other cross-advertising servers'),
  ].map(cmd => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), { body: commands });
  console.log('Slash commands registered');
}

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  await registerCommands();
  startReminderLoop();
  startCrossAdLoop();
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const db = await connectMongo();
  const servers = db.collection('servers');
  if (interaction.commandName === 'setadchannel' || interaction.commandName === 'enablecrossad') {
    // Only allow admins to use these commands
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'You must be a server administrator to use this command.', ephemeral: true });
    }
  }
  if (interaction.commandName === 'setadchannel') {
    const channel = interaction.options.getChannel('channel');
    // Check permissions for @everyone and largest role
    const guild = interaction.guild;
    const everyone = guild.roles.everyone;
    const largestRole = guild.roles.cache.sort((a, b) => b.members.size - a.members.size).first();
    const perms = channel.permissionsFor(everyone);
    const perms2 = channel.permissionsFor(largestRole);
    if (!perms.has(PermissionFlagsBits.ViewChannel) || !perms.has(PermissionFlagsBits.ReadMessageHistory) ||
        !perms2.has(PermissionFlagsBits.ViewChannel) || !perms2.has(PermissionFlagsBits.ReadMessageHistory)) {
      return interaction.reply({ content: 'Channel must be viewable and have Read Message History for @everyone and the largest role.', ephemeral: true });
    }
    await servers.updateOne(
      { guildId: guild.id },
      { $set: { crossAdChannelId: channel.id } },
      { upsert: true }
    );
    return interaction.reply({ content: `Ad channel set to <#${channel.id}>.`, ephemeral: true });
  }
  if (interaction.commandName === 'enablecrossad') {
    const enabled = interaction.options.getBoolean('enabled');
    await servers.updateOne(
      { guildId: interaction.guild.id },
      { $set: { crossAdEnabled: enabled } },
      { upsert: true }
    );
    return interaction.reply({ content: `Cross-advertising ${enabled ? 'enabled' : 'disabled'} for this server.`, ephemeral: true });
  }
  if (interaction.commandName === 'bump') {
    await interaction.deferReply({ ephemeral: true });
    // Fetch this server's ad info
    const thisServer = await servers.findOne({ guildId: interaction.guild.id, crossAdEnabled: true, crossAdChannelId: { $exists: true } });
    if (!thisServer) {
      return interaction.editReply({ content: 'Cross-advertising is not enabled or ad channel not set for this server.' });
    }
    // 2 hour cooldown logic (use bot_bumps collection for Discord bot bumps)
    const db = await connectMongo();
    const botBumps = db.collection('bot_bumps');
    const lastBump = await botBumps.findOne({ guildId: interaction.guild.id }, { sort: { bumpedAt: -1 } });
    const now = new Date();
    if (lastBump && lastBump.bumpedAt && (now.getTime() - new Date(lastBump.bumpedAt).getTime() < 2 * 60 * 60 * 1000)) {
      const nextBump = new Date(new Date(lastBump.bumpedAt).getTime() + 2 * 60 * 60 * 1000);
      const mins = Math.ceil((nextBump.getTime() - now.getTime()) / 60000);
      return interaction.editReply({ content: `You can bump again in ${mins} minute(s).` });
    }
    // Fetch all other servers opted in
    const otherServers = await servers.find({
      guildId: { $ne: interaction.guild.id },
      crossAdEnabled: true,
      crossAdChannelId: { $exists: true }
    }).toArray();
    if (!otherServers.length) {
      return interaction.editReply({ content: 'No other servers are currently opted in for cross-advertising.' });
    }
    // Use real DB data, with fallbacks
    const ad = thisServer;
    const { embed, row } = buildAdEmbed(ad, interaction.guild);
    // Send to all other servers' ad channels
    let sentCount = 0;
    for (const srv of otherServers) {
      try {
        const channel = await client.channels.fetch(srv.crossAdChannelId);
        if (channel && channel.isTextBased()) {
          await channel.send(row ? { embeds: [embed], components: [row] } : { embeds: [embed] });
          sentCount++;
        }
      } catch (e) {
        // Ignore errors for individual servers
      }
    }
    // Record this bump in bot_bumps
    await botBumps.insertOne({ guildId: interaction.guild.id, bumpedAt: now });
    return interaction.editReply({ content: `Your ad was sent to ${sentCount} server(s).` });
  }
});

function isValidHexColor(str) {
  return typeof str === 'string' && /^#([0-9A-Fa-f]{6})$/.test(str);
}

function isValidUrl(str) {
  return typeof str === 'string' && /^https?:\/\//.test(str);
}

function isValidDiscordInvite(url) {
  return typeof url === 'string' && (
    url.startsWith('https://discord.gg/') || url.startsWith('https://discord.com/invite/')
  );
}

// Helper to build a visually appealing ad embed
function buildAdEmbed(ad, guildFallback) {
  const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
  // Fallbacks
  let color = ad.colorTheme;
  if (!isValidHexColor(color)) color = '#5865F2';
  const guildId = ad.guildId || (guildFallback && guildFallback.id);
  let icon = ad.icon || (guildFallback && guildFallback.iconURL && guildFallback.iconURL()) || null;
  let banner = ad.banner || ad.splash || null;

  // If icon is a hash, build CDN URL
  if (icon && !isValidUrl(icon) && guildId) {
    icon = `https://cdn.discordapp.com/icons/${guildId}/${icon}.png`;
  }
  if (!isValidUrl(icon)) icon = null;

  // Banner: prefer highest quality, only set if available
  let bannerUrl = null;
  if (banner && guildId) {
    if (!isValidUrl(banner)) {
      // If it's a hash, build the CDN URL for banner or splash
      if (ad.banner) {
        bannerUrl = `https://cdn.discordapp.com/banners/${guildId}/${ad.banner}.png?size=4096`;
      } else if (ad.splash) {
        bannerUrl = `https://cdn.discordapp.com/splashes/${guildId}/${ad.splash}.png?size=4096`;
      }
    } else {
      // If already a URL, append ?size=4096 if not present
      bannerUrl = banner.includes('?') ? banner : `${banner}?size=4096`;
    }
  }
  if (!isValidUrl(bannerUrl)) bannerUrl = null;

  // Use shortDescription for the embed
  const description = ad.shortDescription || ad.description || 'No description set.';
  const name = ad.name || (guildFallback && guildFallback.name) || 'Server';
  const language = ad.language || 'Unknown';
  const categories = (ad.categories && ad.categories.length) ? ad.categories.join(', ') : 'None';
  let averageRating = 'Unrated';
  if (typeof ad.averageRating === 'number' && !isNaN(ad.averageRating)) {
    averageRating = `${ad.averageRating.toFixed(1)} ⭐`;
  } else if (ad.averageRating) {
    averageRating = `${ad.averageRating} ⭐`;
  }
  // Use ad.link as invite if ad.invite is not present
  const invite = ad.invite || ad.link || (ad.inviteCode ? `https://discord.gg/${ad.inviteCode}` : null);

  // DEBUG LOGGING
  console.log('[buildAdEmbed] ad.invite:', ad.invite, 'ad.link:', ad.link, 'invite:', invite, 'typeof invite:', typeof invite);

  const embed = new EmbedBuilder()
    .setTitle(name)
    .setDescription(description)
    .setColor(color);
  if (icon) embed.setThumbnail(icon);
  if (bannerUrl) embed.setImage(bannerUrl); // Only set if valid, otherwise nothing
  embed.addFields(
    { name: 'Language', value: language, inline: true },
    { name: 'Category', value: categories, inline: true },
    { name: 'Average Rating', value: averageRating, inline: true }
  );
  let row = undefined;
  if (isValidDiscordInvite(invite) && guildId) {
    const joinBtn = new ButtonBuilder()
      .setLabel('Join')
      .setStyle(ButtonStyle.Link)
      .setURL(invite);
    const visitBtn = new ButtonBuilder()
      .setLabel('Visit Server Page')
      .setStyle(ButtonStyle.Link)
      .setURL(`http://hentaidiscord.com/server/${guildId}`);
    row = new ActionRowBuilder().addComponents(joinBtn, visitBtn);
  } else if (isValidDiscordInvite(invite)) {
    // Fallback: only join button
    const joinBtn = new ButtonBuilder()
      .setLabel('Join')
      .setStyle(ButtonStyle.Link)
      .setURL(invite);
    row = new ActionRowBuilder().addComponents(joinBtn);
  } else if (guildId) {
    // Fallback: only visit button
    const visitBtn = new ButtonBuilder()
      .setLabel('Visit Server Page')
      .setStyle(ButtonStyle.Link)
      .setURL(`http://hentaidiscord.com/server/${guildId}`);
    row = new ActionRowBuilder().addComponents(visitBtn);
  }
  return { embed, row };
}

// Reminder loop: check every minute
async function startReminderLoop() {
  setInterval(async () => {
    try {
      const db = await connectMongo();
      const reminders = db.collection('bump_reminders');
      const now = new Date();
      // Find reminders that are due (remindAt <= now and enabled)
      const dueReminders = await reminders.find({ remindAt: { $lte: now }, enabled: true }).toArray();
      for (const reminder of dueReminders) {
        try {
          // Send DM
          const user = await client.users.fetch(reminder.userId).catch(() => null);
          if (user) {
            await user.send(
              `⏰ It's time to bump the server again!\nGo to the server page to bump: http://hentaidiscord.com/server/${reminder.guildId}`
            );
          }
        } catch (e) {
          console.error('Failed to send DM:', e);
        }
        // Remove or update the reminder (remove for now)
        await reminders.deleteOne({ _id: reminder._id });
      }
    } catch (e) {
      console.error('Reminder loop error:', e);
    }
  }, 60 * 1000); // every minute
}

// Hourly cross-advertising logic
async function startCrossAdLoop() {
  setInterval(async () => {
    try {
      const db = await connectMongo();
      const servers = db.collection('servers');
      // Get all servers opted in for cross-advertising and with a channel set
      const allServers = await servers.find({ crossAdEnabled: true, crossAdChannelId: { $exists: true } }).toArray();
      if (allServers.length < 2) return; // Need at least 2 to cross-post
      // For each server, pick a random other server to post
      for (const srv of allServers) {
        // Only post ads from servers that also have crossAdEnabled
        const eligible = allServers.filter(s => s.guildId !== srv.guildId);
        if (!eligible.length) continue;
        // Pick a random ad
        const adServer = eligible[Math.floor(Math.random() * eligible.length)];
        // Build ad embed
        const { embed, row } = buildAdEmbed(adServer);
        try {
          const channel = await client.channels.fetch(srv.crossAdChannelId);
          if (channel && channel.isTextBased()) {
            await channel.send(row ? { embeds: [embed], components: [row] } : { embeds: [embed] });
          }
        } catch (e) {
          // Ignore errors for individual servers
        }
      }
    } catch (e) {
      console.error('Cross-ad loop error:', e);
    }
  }, 60 * 60 * 1000); // every hour
}

client.login(process.env.DISCORD_BOT_TOKEN);