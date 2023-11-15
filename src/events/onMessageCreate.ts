import { Message, PermissionFlagsBits } from "discord.js";

import { ExtendedClient } from "../interface/ExtendedClient";
import { getMuteDurationUnit } from "../utils/getMuteDurationUnit";
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
      if (
        message.member?.permissions.has(PermissionFlagsBits.ModerateMembers)
      ) {
        if (message.content.startsWith("!mute")) {
          const [, id, durationString, ...reason] =
            message.content.split(/\s+/);
          const target = await message.guild?.members.fetch(id);
          if (!target) {
            await message.reply("Target not found.");
            return;
          }
          const durationNumber = parseInt(
            durationString.replace(/\w$/, ""),
            10
          );
          const durationUnit = durationString.replace(/^\d+/, "");
          const conversion = getMuteDurationUnit(durationUnit);
          if (!conversion) {
            await message.reply(`Invalid unit ${durationUnit}.`);
            return;
          }
          const time = durationNumber * conversion;
          if (time > 1000 * 60 * 60 * 24 * 28) {
            await message.reply("Cannot time out user for more than 28 days.");
            return;
          }
          await target.timeout(time, reason.join(" ") || "No reason provided.");
          await message.reply({ content: "Done" });
          const logChannel = message.guild?.channels.cache.find(
            (c) => c.name === "bot-logs"
          );
          if (logChannel && "send" in logChannel) {
            await logChannel?.send({
              content: `<@!${message.author.id}> muted <@!${target.id}> (${
                target.id
              }) - ${durationString} for: ${
                reason.join(" ") ?? "No reason provided."
              }`,
              allowedMentions: {
                users: [],
              },
            });
          }
        }
        if (message.content.startsWith("!unmute")) {
          const [, id, ...reason] = message.content.split(/\s+/);
          const target = await message.guild?.members.fetch(id);
          if (!target) {
            await message.reply("Target not found.");
            return;
          }
          await target.timeout(null, reason.join(" ") || "No reason provided.");
          const logChannel = message.guild?.channels.cache.find(
            (c) => c.name === "bot-logs"
          );
          await message.reply({ content: "Done" });
          if (logChannel && "send" in logChannel) {
            await logChannel?.send({
              content: `<@!${message.author.id}> unmuted <@!${target.id}> (${
                target.id
              }) for: ${reason.join(" ") ?? "No reason provided."}`,
              allowedMentions: {
                users: [],
              },
            });
          }
        }
      }
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
