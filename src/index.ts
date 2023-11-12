import {
  Client,
  Events,
  GatewayIntentBits,
  Message,
  WebhookClient,
} from "discord.js";

enum Webhooks {
  NewCommissions = "1172850885571911760",
  CompleteCommissions = "1173062416041525259",
}

const DMTexts: { [key in Webhooks]: (message: Message) => string } = {
  [Webhooks.NewCommissions]: (message) =>
    `[Here is the donation commission you claimed~!](${message.url})\n> ${message.content}`,
  [Webhooks.CompleteCommissions]: (message) =>
    `[Thank you for agreeing to deliver the following commission~!](${message.url})\n> ${message.content}`,
};

const isValidHook = (id: string): id is Webhooks =>
  (
    [Webhooks.NewCommissions, Webhooks.CompleteCommissions] as string[]
  ).includes(id);

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
    if (!isValidHook(message.author.id)) {
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
    const message = await r.message.fetch().catch(async (err) => {
      await debug.send({
        content: `[Failed to fetch message:](<${r.message.url}>) ${err.message}`,
      });
      return null;
    });
    if (!message || !isValidHook(message.author.id)) {
      return;
    }
    if (reaction.count > 2) {
      await r.users.remove(user.id);
      return;
    }
    const files = [...message.attachments.values()];
    await user
      .send({
        content: DMTexts[message.author.id](message),
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
