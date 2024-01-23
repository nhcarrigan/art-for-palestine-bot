import { createHmac } from "crypto";
import { readFile } from "fs/promises";
import http from "http";
import https from "https";

import express from "express";

import { Trello } from "../config/Trello";
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
