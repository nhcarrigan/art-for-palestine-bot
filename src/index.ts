import { Client, Events, GatewayIntentBits, WebhookClient } from "discord.js";

(async () => {
  const debug = new WebhookClient({
    url: process.env.DEBUG || "",
  });
  const bot = new Client({
    intents: [
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  });

  bot.on(Events.ClientReady, async () => {
    await debug.send("Bot is online and ready to help!");
  });

  bot.on(Events.MessageCreate, async (message) => {
    if (message.author.id !== "1172850885571911760") {
      return;
    }
    await message.react("✅").catch(async (err) => {
      await debug.send({
        content: `[Failed to add reaction:](<${message.url}>) ${err.message}`,
      });
    });
  });

  bot.on(Events.MessageReactionAdd, async (r, user) => {
    if (user.bot) {
      return;
    }
    const reaction = await r.fetch().catch(async (err) => {
      await debug.send({
        content: `[Failed to fetch reactions:](<${r.message.url}>) ${err.message}`,
      });
      return null;
    });
    if (!reaction) {
      return;
    }
    if (reaction.count > 2) {
      await r.users.remove(user.id);
      return;
    }
    const message = await r.message.fetch().catch(async (err) => {
      await debug.send({
        content: `[Failed to fetch message:](<${r.message.url}>) ${err.message}`,
      });
      return null;
    });
    if (!message) {
      return;
    }
    const files = [...message.attachments.values()];
    await user
      .send({
        content: `[Here is the donation commission you claimed~!](${message.url})\n> ${message.content}`,
        files,
      })
      .catch(async (err) => {
        await debug.send({
          content: `[Failed to DM ${user.username}:](<${r.message.url}>) ${err.message}`,
        });
      });
  });

  await bot.login(process.env.TOKEN);
})();
