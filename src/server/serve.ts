import { createHmac } from "crypto";
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
      const { name, images, action, platform, handle, note, email, request } =
        req.body;
      const files: AttachmentBuilder[] = [];
      for (const imageUrl of images) {
        const image = await fetch(imageUrl);
        const imageBuffer = await image.arrayBuffer();
        const imageFinal = Buffer.from(imageBuffer);
        const file = new AttachmentBuilder(imageFinal, {
          name: "reference.png",
        });
        files.push(file);
      }

      if (!process.env.TRELLO_TOKEN || !process.env.TRELLO_KEY) {
        await bot.debug.send({
          content:
            "Cannot create card on Trello. Missing environment variables.",
        });
        await bot.comm.send({
          content: `${name} | Trello failed to generate. | References attached below:`,
          files,
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
          } to update them on art.\n\nUSER NOTE: ${note}\nART REQUEST: ${request}`
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
        }&name=reference.png&url=${encodeURIComponent(
          images[0]
        )}&setCover=true`,
        {
          method: "POST",
          headers: {
            accept: "application/json",
          },
        }
      );
      for (const imageUrl of images.slice(1)) {
        await fetch(
          `https://api.trello.com/1/cards/${card.id}/attachments?key=${
            process.env.TRELLO_KEY
          }&token=${
            process.env.TRELLO_TOKEN
          }&name=reference.png&url=${encodeURIComponent(imageUrl)}`,
          {
            method: "POST",
            headers: {
              accept: "application/json",
            },
          }
        );
      }
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
        content: `${name} | [Trello](<${card.url}>) | References attached below.\nYou can ignore this ID it's just for the bot: ${card.id}`,
        files,
      });
      await bot.db.rewards.create({
        data: {
          trelloId: card.id,
          createdAt: Date.now(),
          claimedBy: "",
          completed: false,
        },
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

  /**
   * Trello expects a 200 head status.
   */
  app.head("/trello", (_req, res) => {
    res.status(200).send("OK~");
  });

  app.post("/trello", async (req, res) => {
    const secret = process.env.TRELLO_SECRET;
    if (!secret) {
      res.status(500).send("Missing trello key~!");
      await bot.debug.send({
        content:
          "Received a request to the trello endpoint, but key is not configured.",
      });
      return;
    }
    const headerHash = req.headers["x-trello-webhook"];
    const getDigest = (s: string) =>
      createHmac("sha1", secret).update(s).digest("base64");
    const content = JSON.stringify(req.body) + process.env.TRELLO_HOOK_CALLBACK;
    const contentHash = getDigest(content);
    if (headerHash !== contentHash) {
      res.status(403).send("Invalid hash!");
      await bot.debug.send({
        content:
          "Received a request to the trello endpoint, but hash was incorrect.",
      });
      return;
    }
    res.status(200).send("OK~!");
    const oldList = req.body.action?.data?.old?.idList;
    const newList = req.body.action?.data?.card?.idList;
    const cardId = req.body.action?.data?.card?.id;
    if (
      !oldList ||
      !newList ||
      !cardId ||
      oldList === newList ||
      newList !== Trello.readyToSendListId
    ) {
      return;
    }

    const cardRes = await fetch(
      `https://api.trello.com/1/cards/${cardId}?key=${process.env.TRELLO_KEY}&token=${process.env.TRELLO_TOKEN}`
    );
    const card = (await cardRes.json()) as {
      id: string;
      url: string;
      name: string;
      desc: string;
    };
    const contact = card.desc
      .split(/\n+/g)
      .find((s) => s.startsWith("Please contact them"));
    await bot.dist.send({
      content: `${card.name} | [Trello Card](<${card.url}>) | ${contact}\nYou can ignore this ID it's just for the bot: ${card.id}`,
    });
    await bot.db.rewards.update({
      where: {
        trelloId: card.id,
      },
      data: {
        completed: true,
      },
    });
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
