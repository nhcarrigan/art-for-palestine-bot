import { Interaction } from "discord.js";

import { ExtendedClient } from "../interface/ExtendedClient";
import { ticketClaimHandler } from "../modules/buttons/ticketClaim";
import { ticketCloseHandler } from "../modules/buttons/ticketClose";
import { ticketOpenHandler } from "../modules/buttons/ticketOpen";
import { handleTicketModal } from "../modules/modals/handleTicketModal";

/**
 * Handles the logic for the interaction create event.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 * @param {Interaction} interaction The interaction payload from Discord.
 */
export const onInteractionCreate = async (
  bot: ExtendedClient,
  interaction: Interaction
) => {
  try {
    if (interaction.isModalSubmit()) {
      if (interaction.customId === "ticket-modal") {
        await handleTicketModal(bot, interaction);
      }
    }

    if (interaction.isButton()) {
      if (!interaction.inCachedGuild()) {
        return;
      }
      if (interaction.customId === "ticket") {
        await ticketOpenHandler(bot, interaction);
      }
      if (interaction.customId === "claim") {
        await ticketClaimHandler(bot, interaction);
      }
      if (interaction.customId === "close") {
        await ticketCloseHandler(bot, interaction);
      }
    }
  } catch (err) {
    await bot.debug.send(
      `Error in interaction create event: ${(err as Error).message}`
    );
  }
};
