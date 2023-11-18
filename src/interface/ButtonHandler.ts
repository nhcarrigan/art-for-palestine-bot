import { ButtonInteraction } from "discord.js";

import { ExtendedClient } from "./ExtendedClient";

export type ButtonHandler = (
  Bot: ExtendedClient,
  interaction: ButtonInteraction<"cached">
) => Promise<void>;
