import {
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from "discord.js";

import { DMTexts } from "../config/Webhooks";
import { ExtendedClient } from "../interface/ExtendedClient";
import { isValidWebhook } from "../utils/isValidWebhook";

/**
 * Handles the message reaction add. If added to a valid webhook, processes logic to send
 * DM to the first user who reacted, remove further reactions.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 * @param {MessageReaction | PartialMessageReaction} r The reaction payload from Discord.
 * @param {User | PartialUser} user The user who reacted.
 */
export const onReactionAdd = async (
  bot: ExtendedClient,
  r: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) => {
  try {
    if (user.bot) {
      return;
    }
    const reaction = await r.fetch().catch(async (err) => {
      await bot.debug.send({
        content: `[Failed to fetch reactions:](<${r.message.url}>) ${err.message}`,
      });
      return null;
    });
    if (!reaction) {
      return;
    }
    const message = await r.message.fetch().catch(async (err) => {
      await bot.debug.send({
        content: `[Failed to fetch message:](<${r.message.url}>) ${err.message}`,
      });
      return null;
    });
    if (!message || !isValidWebhook(message.author.id)) {
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
        await bot.debug.send({
          content: `[Failed to DM ${user.username}:](<${r.message.url}>) ${err.message}`,
        });
      });
  } catch (err) {
    await bot.debug.send(
      `Error in processing new reaction: ${(err as Error).message}`
    );
  }
};
