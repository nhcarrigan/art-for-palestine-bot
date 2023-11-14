import { readFile } from "fs/promises";
import http from "http";
import https from "https";

import {
  AttachmentBuilder,
  Client,
  Events,
  GatewayIntentBits,
  Message,
  WebhookClient,
} from "discord.js";
import express from "express";

enum Webhooks {
  NewCommissions = "1172850885571911760",
  CompleteCommissions = "1173062416041525259",
}

const DMTexts: { [key in Webhooks]: (message: Message) => string } = {
  [Webhooks.NewCommissions]: (message) =>
    `[Here is the donation commission you claimed~!](${message.url})\n> ${message.content}`,
  [Webhooks.CompleteCommissions]: (message) =>
    `[Thank you for agreeing to deliver the following commission~!](${message.url})\n> ${message.content}`,
};

const isValidHook = (id: string): id is Webhooks =>
  (
    [Webhooks.NewCommissions, Webhooks.CompleteCommissions] as string[]
  ).includes(id);

(async () => {
  const debug = new WebhookClient({
    url: process.env.DEBUG || "",
  });
  const bot = new Client({
    intents: [
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  });

  bot.on(Events.ClientReady, async () => {
    await debug.send("Bot is online and ready to help!");
  });

  bot.on(Events.MessageCreate, async (message) => {
    if (!isValidHook(message.author.id)) {
      return;
    }
    await message.react("✅").catch(async (err) => {
      await debug.send({
        content: `[Failed to add reaction:](<${message.url}>) ${err.message}`,
      });
    });
  });

  bot.on(Events.MessageReactionAdd, async (r, user) => {
    if (user.bot) {
      return;
    }
    const reaction = await r.fetch().catch(async (err) => {
      await debug.send({
        content: `[Failed to fetch reactions:](<${r.message.url}>) ${err.message}`,
      });
      return null;
    });
    if (!reaction) {
      return;
    }
    const message = await r.message.fetch().catch(async (err) => {
      await debug.send({
        content: `[Failed to fetch message:](<${r.message.url}>) ${err.message}`,
      });
      return null;
    });
    if (!message || !isValidHook(message.author.id)) {
      return;
    }
    if (reaction.count > 2) {
      await r.users.remove(user.id);
      return;
    }
    const files = [...message.attachments.values()];
    await user
      .send({
        content: DMTexts[message.author.id](message),
        files,
      })
      .catch(async (err) => {
        await debug.send({
          content: `[Failed to DM ${user.username}:](<${r.message.url}>) ${err.message}`,
        });
      });
  });

  await bot.login(process.env.TOKEN);

  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.status(302).redirect("https://art4palestine.org/");
  });

  app.post("/airtable", async (req, res) => {
    try {
      if (req.body.secret !== process.env.AIRTABLE_SECRET) {
        res.status(403).send("Invalid secret.");
        await debug.send({
          content: "Received an airtable payload with an invalid secret.",
        });
        return;
      }
      res.status(200).send("OK~!");
      const { name, imageUrl } = req.body;
      const image = await fetch(imageUrl);
      const imageBuffer = await image.arrayBuffer();
      const imageFinal = Buffer.from(imageBuffer);
      const file = new AttachmentBuilder(imageFinal, {
        name: "reference.png",
      });
      const hook = new WebhookClient({ url: process.env.NEW_COMM_HOOK ?? "" });
      await hook.send({
        content: `${name} | Trello coming soon | [Reference](<${image.url}>)`,
        files: [file],
      });
      return;
    } catch (err) {
      await debug.send({
        content: `Failed to process airtable automation: ${
          (err as Error).message
        }`,
      });
    }
  });

  const httpServer = http.createServer(app);

  httpServer.listen(10080, async () => {
    await debug.send("http server listening on port 10080");
  });

  if (process.env.NODE_ENV === "production") {
    const privateKey = await readFile(
      "/etc/letsencrypt/live/afp.nhcarrigan.com/privkey.pem",
      "utf8"
    );
    const certificate = await readFile(
      "/etc/letsencrypt/live/afp.nhcarrigan.com/cert.pem",
      "utf8"
    );
    const ca = await readFile(
      "/etc/letsencrypt/live/afp.nhcarrigan.com/chain.pem",
      "utf8"
    );

    const credentials = {
      key: privateKey,
      cert: certificate,
      ca: ca,
    };

    const httpsServer = https.createServer(credentials, app);

    httpsServer.listen(10443, async () => {
      await debug.send("https server listening on port 10443");
    });
  }
})();
