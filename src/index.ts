import { execSync } from "child_process";

import { Client, Events, GatewayIntentBits, WebhookClient } from "discord.js";

import { onMemberAdd } from "./events/onMemberAdd";
import { onMessageCreate } from "./events/onMessageCreate";
import { onReactionAdd } from "./events/onReactionAdd";
import { onReady } from "./events/onReady";
import { ExtendedClient } from "./interface/ExtendedClient";
import { logHandler } from "./utils/logHandler";
import { onInteractionCreate } from "./events/onInteractionCreate";

(async () => {
  if (
    !process.env.TOKEN ||
    !process.env.DEBUG ||
    !process.env.COMM ||
    !process.env.DIST ||
    !process.env.NEWS ||
    !process.env.TICKET
  ) {
    logHandler.log("error", "Missing environment variables.");
    return;
  }
  const bot = new Client({
    intents: [
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ],
  }) as ExtendedClient;
  bot.debug = new WebhookClient({ url: process.env.DEBUG });
  bot.comm = new WebhookClient({ url: process.env.COMM });
  bot.dist = new WebhookClient({ url: process.env.DIST });
  bot.news = new WebhookClient({ url: process.env.NEWS });
  bot.ticket = new WebhookClient({ url: process.env.TICKET });

  const commit = execSync("git rev-parse HEAD").toString().trim();

  await bot.debug.send({
    content: `Bot is starting up.\nVersion: ${
      process.env.npm_package_version
    }\nCommit: [${commit.slice(
      0,
      7
    )}](<https://github.com/nhcarrigan/art-for-palestine-bot/commit/${commit}>)`,
  });

  bot.on(Events.ClientReady, async () => {
    await onReady(bot);
  });

  bot.on(Events.MessageCreate, async (message) => {
    await onMessageCreate(bot, message);
  });

  bot.on(Events.MessageReactionAdd, async (r, user) => {
    await onReactionAdd(bot, r, user);
  });

  bot.on(Events.GuildMemberAdd, async (member) => {
    await onMemberAdd(bot, member);
  });

  bot.on(Events.InteractionCreate, async (interaction) => {
    await onInteractionCreate(bot, interaction);
  });

  await bot.login(process.env.TOKEN);
})();
