import { PrismaClient } from "@prisma/client";
import { Client, WebhookClient } from "discord.js";

export interface ExtendedClient extends Client {
  db: PrismaClient;
  debug: WebhookClient;
  comm: WebhookClient;
  dist: WebhookClient;
  news: WebhookClient;
  ticket: WebhookClient;
  lastArticle: number;
  ticketLogs: { [key: string]: string };
}
