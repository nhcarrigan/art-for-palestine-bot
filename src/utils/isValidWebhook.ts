import { Webhooks } from "../config/Webhooks";

/**
 * Checks if the webhook ID is present in the enum.
 *
 * @param {string} id The ID to check.
 * @returns {boolean} If the webhook ID is valid.
 */
export const isValidWebhook = (id: string): id is Webhooks =>
  (
    [Webhooks.NewCommissions, Webhooks.CompleteCommissions] as string[]
  ).includes(id);
