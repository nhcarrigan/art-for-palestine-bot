import { Message } from "discord.js";

export enum Webhooks {
  NewCommissions = "1172850885571911760",
  CompleteCommissions = "1173062416041525259",
  NewTest = "1173009530511171634",
  CompleteTest = "946487942526935060",
}

/**
 * Grabs the message from Discord, formats it based on the webhook ID.
 *
 * @param {Message} message The message payload from Discord.
 * @returns {string} The formatted text to send.
 */
export const DMTexts: { [key in Webhooks]: (message: Message) => string } = {
  [Webhooks.NewCommissions]: (message) =>
    `[Here is the donation commission you claimed~!](${message.url})\n> ${message.content}`,
  [Webhooks.CompleteCommissions]: (message) =>
    `[Thank you for agreeing to deliver the following commission~!](${message.url})\n> ${message.content}`,
  [Webhooks.NewTest]: (message) =>
    `[Here is the donation commission you claimed~!](${message.url})\n> ${message.content}`,
  [Webhooks.CompleteTest]: (message) =>
    `[Thank you for agreeing to deliver the following commission~!](${message.url})\n> ${message.content}`,
};
