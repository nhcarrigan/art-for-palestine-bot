import { readFile, writeFile } from "fs/promises";
import { join } from "path";

import { AttachmentBuilder } from "discord.js";

import { ActionsToLabel, PlatformsToLabel, Trello } from "../config/Trello";
import { AirtableResponse } from "../interface/AirtableResponse";
import { ExtendedClient } from "../interface/ExtendedClient";

/**
 * Fetches the Airtable records and pipes new records to trello.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 */
export const checkAirtableRecords = async (bot: ExtendedClient) => {
  try {
    const latestId = await readFile(
      join(__dirname, "..", "..", "latestAirtableRecord.txt"),
      "utf-8"
    );
    const records = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE_ID}?maxRecords=100&sort%5B0%5D%5Bfield%5D=Created&sort%5B0%5D%5Bdirection%5D=desc`,
      {
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_KEY}`,
        },
      }
    );
    const res = (await records.json()) as AirtableResponse;
    const alreadySeenIndex = res.records.findIndex((r) => r.id === latestId);
    if (alreadySeenIndex === 0) {
      return;
    }
    const newRecords = res.records.slice(0, alreadySeenIndex);
    const newLatestId = newRecords[0]?.id as string;

    await writeFile(
      join(__dirname, "..", "..", "latestAirtableRecord.txt"),
      newLatestId,
      "utf-8"
    );

    for (const record of newRecords) {
      const {
        Name: name,
        Reference: images,
        Action: action,
        "Contact Method": platform,
        Handle: handle,
        "Anything Else?": note,
        "Email Address": email,
        "What would you like us to draw?": request,
      } = record.fields;
      const files: AttachmentBuilder[] = [];
      for (const imageUrl of images) {
        const image = await fetch(imageUrl.url);
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
          images[0]?.url ?? "https://cdn.naomi.lgbt/banner.png"
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
          }&name=reference.png&url=${encodeURIComponent(imageUrl.url)}`,
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
      const msg = await bot.comm.send({
        content: `${name} | [Trello](<${card.url}>) | References attached below.\nYou can ignore this ID it's just for the bot: ${card.id}`,
        files,
      });
      await bot.db.rewards.create({
        data: {
          trelloId: card.id,
          createdAt: Date.now(),
          claimedBy: "",
          completed: false,
          messageId: msg.id,
        },
      });
      return;
    }
  } catch (err) {
    await bot.debug.send(
      `Error in check airtable records: ${(err as Error).message}`
    );
  }
};
