import { Webhooks } from "./Webhooks";

export const Trello = {
  boardId: "",
  newCardListId: "6552f24264ac58e98f8b78cd",
  platformLabels: {
    discord: "6552f2b18af54bcca998abfe",
    twitter: "6552f2cb9f21432b29106558",
    email: "6552f2cee1258dfe159d48c8",
  },
  actionLabels: {
    donate: "6552f2d257c42c85759d0199",
    call: "6552f2d6d0e69a4c17f5f8ab",
    protest: "6552f2dbfa9f5ac4267b136a",
  },
  checklistId: "6552f66d91daf000137ed4d2",
};

export const PlatformsToLabel: Record<string, string> = {
  Email: Trello.platformLabels.email,
  Discord: Trello.platformLabels.discord,
  Twitter: Trello.platformLabels.twitter,
};

export const ActionsToLabel: Record<string, string> = {
  "Sent a donation": Trello.actionLabels.donate,
  "Called my representatives": Trello.actionLabels.call,
  "Attended a protest": Trello.actionLabels.protest,
};

/**
 * Grabs the message from Discord, formats it into a Trello comment.
 *
 * @param {string} userName The name of the user that triggered the comment.
 * @returns {string} The formatted text to send.
 */
export const TrelloComments: {
  [key in Webhooks]: (userName: string) => string;
} = {
  [Webhooks.NewCommissions]: (userName) => `Artwork claimed by ${userName}.`,
  [Webhooks.CompleteCommissions]: (userName) =>
    `Distribution claimed by ${userName}.`,
  [Webhooks.NewTest]: (userName) => `Artwork claimed by ${userName}.`,
  [Webhooks.CompleteTest]: (userName) => `Distribution claimed by ${userName}.`,
};
