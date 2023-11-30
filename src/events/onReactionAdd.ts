import {
  MessageReaction,
  PartialMessageReaction,
  PartialUser,
  User,
} from "discord.js";

import { TrelloComments } from "../config/Trello";
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
    const trelloId = message.content.split(
      "You can ignore this ID it's just for the bot: "
    )[1];
    if (trelloId) {
      await fetch(
        `https://api.trello.com/1/cards/${trelloId}/actions/comments?text=${TrelloComments[
          message.author.id
        ](user.displayName || user.username || user.id)}&key=${
          process.env.TRELLO_KEY
        }&token=${process.env.TRELLO_TOKEN}`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        }
      );
    }
  } catch (err) {
    await bot.debug.send(
      `Error in processing new reaction: ${(err as Error).message}`
    );
  }
};
