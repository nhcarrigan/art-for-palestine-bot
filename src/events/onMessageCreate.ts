import { Message } from "discord.js";

import { ExtendedClient } from "../interface/ExtendedClient";
import { isValidWebhook } from "../utils/isValidWebhook";
import { logHandler } from "../utils/logHandler";

/**
 * Handles the message create event. Adds reactions to messages from approved
 * webhooks.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 * @param {Message} message The message payload from Discord.
 */
export const onMessageCreate = async (
  bot: ExtendedClient,
  message: Message
) => {
  try {
    if (!message.author.bot) {
      return;
    }
    if (message.author.bot && !isValidWebhook(message.author.id)) {
      logHandler.log(
        "info",
        `Got bot message from ${message.author.id} but is not a valid webhook.`
      );
      return;
    }
    logHandler.log("info", "Processing webhook message.");
    await message.react("✅").catch(async (err) => {
      await bot.debug.send({
        content: `[Failed to add reaction:](<${message.url}>) ${err.message}`,
      });
    });
    logHandler.log("info", "Added reaction~!");
  } catch (err) {
    await bot.debug.send(
      `Error in message create event: ${(err as Error).message}`
    );
  }
};
