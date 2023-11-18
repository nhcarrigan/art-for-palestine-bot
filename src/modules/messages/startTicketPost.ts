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
      "If you need help with one of our projects, and you want to speak with our support team privately, you can open a ticket!\n\nClick the button below to open a private ticket with the support team."
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
