import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Message,
} from "discord.js";

import { ExtendedClient } from "../../interface/ExtendedClient";

/**
 * Handles the logic to start a ticket post.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 * @param {Message} message The message payload from Discord.
 */
export const startTicketPost = async (
  bot: ExtendedClient,
  message: Message
) => {
  try {
    const embed = new EmbedBuilder();
    embed.setTitle("Need Help?");
    embed.setDescription(
      `**Need Help?**
If you have concerns with behavior in this Discord server, click the button below to open a private ticket with the Moderation team.

If you want to contact the team for any other reason, you can message an Admin or send an email to \`contact@art4palestine.org\`.`
    );
    embed.setColor("#0099ff");

    const button = new ButtonBuilder()
      .setLabel("Open a Ticket!")
      .setEmoji("❔")
      .setStyle(ButtonStyle.Primary)
      .setCustomId("ticket");

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
    await message.channel.send({ embeds: [embed], components: [row] });
  } catch (err) {
    await bot.debug.send(
      `Error in start ticket post module: ${(err as Error).message}`
    );
    await message.reply({
      content:
        "Forgive me, but I failed to complete your request. Please try again later.",
    });
  }
};
