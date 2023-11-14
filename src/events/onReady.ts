import { ExtendedClient } from "../interface/ExtendedClient";
import { serve } from "../server/serve";

/**
 * Handles the logic when the bot is ready to receive Discord events.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 */
export const onReady = async (bot: ExtendedClient) => {
  try {
    await bot.debug.send("Bot is online and ready to help!");
    await serve(bot);
  } catch (err) {
    await bot.debug.send(`Error on ready event: ${(err as Error).message}`);
  }
};
