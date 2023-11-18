import {
  ActionRowBuilder,
  ModalBuilder,
  ModalActionRowComponentBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { ButtonHandler } from "../../interface/ButtonHandler";

/**
 * Generates the modal for opening a new ticket.
 */
export const ticketOpenHandler: ButtonHandler = async (bot, interaction) => {
  try {
    const ticketModal = new ModalBuilder()
      .setCustomId("ticket-modal")
      .setTitle("Naomi's Ticket System");
    const reasonInput = new TextInputBuilder()
      .setCustomId("reason")
      .setLabel("Why are you opening this ticket?")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const actionRow =
      new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
        reasonInput
      );
    ticketModal.addComponents(actionRow);
    await interaction.showModal(ticketModal);
  } catch (err) {
    await bot.debug.send(
      `Error in open ticket module: ${(err as Error).message}`
    );
    await interaction.editReply({
      content:
        "Forgive me, but I failed to complete your request. Please try again later.",
    });
  }
};
