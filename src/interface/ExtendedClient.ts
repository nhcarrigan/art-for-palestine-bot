import { Client, WebhookClient } from "discord.js";

export interface ExtendedClient extends Client {
  debug: WebhookClient;
  comm: WebhookClient;
  dist: WebhookClient;
}
