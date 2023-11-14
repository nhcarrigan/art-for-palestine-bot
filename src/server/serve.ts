import { readFile } from "fs/promises";
import http from "http";
import https from "https";

import { AttachmentBuilder } from "discord.js";
import express from "express";

import { ExtendedClient } from "../interface/ExtendedClient";

/**
 * Instantiates the web server for listening to webhook payloads.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 */
export const serve = async (bot: ExtendedClient) => {
  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.status(302).redirect("https://art4palestine.org/");
  });

  app.post("/airtable", async (req, res) => {
    try {
      if (req.body.secret !== process.env.AIRTABLE_SECRET) {
        res.status(403).send("Invalid secret.");
        await bot.debug.send({
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
      await bot.comm.send({
        content: `${name} | Trello coming soon | [Reference](<${image.url}>)`,
        files: [file],
      });
      return;
    } catch (err) {
      await bot.debug.send({
        content: `Failed to process airtable automation: ${
          (err as Error).message
        }`,
      });
    }
  });

  const httpServer = http.createServer(app);

  httpServer.listen(10080, async () => {
    await bot.debug.send("http server listening on port 10080");
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
      await bot.debug.send("https server listening on port 10443");
    });
  }
};
