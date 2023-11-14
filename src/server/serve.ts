import { readFile } from "fs/promises";
import http from "http";
import https from "https";

import { AttachmentBuilder } from "discord.js";
import express from "express";

import { ActionsToLabel, PlatformsToLabel, Trello } from "../config/Trello";
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
      const { name, imageUrl, action, platform, handle, note, email } =
        req.body;
      const image = await fetch(imageUrl);
      const imageBuffer = await image.arrayBuffer();
      const imageFinal = Buffer.from(imageBuffer);
      const file = new AttachmentBuilder(imageFinal, {
        name: "reference.png",
      });
      if (!process.env.TRELLO_TOKEN || !process.env.TRELLO_KEY) {
        await bot.debug.send({
          content:
            "Cannot create card on Trello. Missing environment variables.",
        });
        await bot.comm.send({
          content: `${name} | Trello failed to generate. | [Reference](<${image.url}>)`,
          files: [file],
        });
        return;
      }
      const cardRes = await fetch(
        `https://api.trello.com/1/cards?idList=${Trello.newCardListId}&key=${
          process.env.TRELLO_KEY
        }&token=${process.env.TRELLO_TOKEN}&name=${encodeURIComponent(
          name
        )}&desc=${encodeURIComponent(
          `${name} helped us with: ${action}\n\nPlease contact them at ${
            platform === "Email" ? email : `${handle} on ${platform}`
          } to update them on art.\n\nUSER NOTE: ${note}`
        )}`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        }
      );
      const card = (await cardRes.json()) as { id: string; url: string };
      await fetch(
        `https://api.trello.com/1/cards/${card.id}/attachments?key=${
          process.env.TRELLO_KEY
        }&token=${
          process.env.TRELLO_TOKEN
        }&name=reference.png&url=${encodeURIComponent(imageUrl)}&setCover=true`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        }
      );
      // Use this if we want to add checklist to every card :3
      //   await fetch(
      //     `https://api.trello.com/1/cards/${
      //       card.id
      //     }/checklists?idChecklistSource=${
      //       Trello.checklistId
      //     }&name=${encodeURIComponent("To Do")}&key=${
      //       process.env.TRELLO_KEY
      //     }&token=${process.env.TRELLO_TOKEN}`,
      //     {
      //       method: "POST",
      //       headers: {
      //         accept: "application/json",
      //       },
      //     }
      //   );
      if (PlatformsToLabel[platform]) {
        await fetch(
          `https://api.trello.com/1/cards/${card.id}/idLabels?value=${PlatformsToLabel[platform]}&key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_TOKEN}`,
          {
            method: "POST",
            headers: {
              accept: "application/json",
            },
          }
        );
      }
      if (ActionsToLabel[action]) {
        await fetch(
          `https://api.trello.com/1/cards/${card.id}/idLabels?value=${ActionsToLabel[action]}&key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_TOKEN}`,
          {
            method: "POST",
            headers: {
              accept: "application/json",
            },
          }
        );
      }
      await bot.comm.send({
        content: `${name} | [Trello](<${card.url}>) | [Reference](<${image.url}>)\nYou can ignore this it's just for the bot. ${card.id}`,
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
