import { ExtendedClient } from "../interface/ExtendedClient";
import { serve } from "../server/serve";
import { getNewsFeed } from "../utils/getNewsFeed";

/**
 * Handles the logic when the bot is ready to receive Discord events.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 */
export const onReady = async (bot: ExtendedClient) => {
  try {
    await bot.debug.send("Bot is online and ready to help!");
    await bot.debug.send("Fetching initial news feed...");
    await getNewsFeed(bot);
    await bot.debug.send("Fetching news posts every 10 minutes.");
    setInterval(async () => await getNewsFeed(bot), 1000 * 60 * 10);
    await serve(bot);
  } catch (err) {
    await bot.debug.send(`Error on ready event: ${(err as Error).message}`);
  }
};
