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
    !process.env.DIST
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
