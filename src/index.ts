import { execSync } from "child_process";

import { Client, Events, GatewayIntentBits, WebhookClient } from "discord.js";

import { onMessageCreate } from "./events/onMessageCreate";
import { onReactionAdd } from "./events/onReactionAdd";
import { onReady } from "./events/onReady";
import { ExtendedClient } from "./interface/ExtendedClient";
import { logHandler } from "./utils/logHandler";

(async () => {
  if (
    !process.env.TOKEN ||
    !process.env.DEBUG ||
    !process.env.COMM ||
    !process.env.DIST ||
    !process.env.NEWS
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
    ],
  }) as ExtendedClient;
  bot.debug = new WebhookClient({ url: process.env.DEBUG });
  bot.comm = new WebhookClient({ url: process.env.COMM });
  bot.dist = new WebhookClient({ url: process.env.DIST });
  bot.news = new WebhookClient({ url: process.env.NEWS });

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

  await bot.login(process.env.TOKEN);
})();
