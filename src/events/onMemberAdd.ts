import { GuildMember } from "discord.js";

import { ExtendedClient } from "../interface/ExtendedClient";

/**
 * Handles the member add event from discord. Gives the new member
 * the `Members` role.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 * @param {GuildMember} member The member payload from Discord.
 */
export const onMemberAdd = async (bot: ExtendedClient, member: GuildMember) => {
  try {
    await member.roles.add("1173580547952484352");
  } catch (err) {
    await bot.debug.send(
      `Error on member add event: ${(err as Error).message}`
    );
  }
};
