import { scheduleJob } from "node-schedule";

import { ExtendedClient } from "../interface/ExtendedClient";
import { checkAirtableRecords } from "../modules/checkAirtableRecords";
import { fetchMessages } from "../modules/messages/fetchMessages";
import { sendUnclaimedArt } from "../modules/reminders/sendUnclaimedArt";
import { sendUnfinishedArt } from "../modules/reminders/sendUnfinishedArt";
import { serve } from "../server/serve";
import { getNewsFeed } from "../utils/getNewsFeed";

/**
 * Handles the logic when the bot is ready to receive Discord events.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 */
export const onReady = async (bot: ExtendedClient) => {
  try {
    await bot.debug.send("Bot is online and ready to help!");
    // donor channel
    await fetchMessages(bot, "1172568787330019340");
    // delivery channel
    await fetchMessages(bot, "1173061747737903315");
    await bot.debug.send("Fetching initial news feed...");
    await getNewsFeed(bot);
    await bot.debug.send("Fetching news posts every 10 minutes.");
    setInterval(async () => await getNewsFeed(bot), 1000 * 60 * 10);
    await bot.debug.send("Fetching new airtable submissions every 60 minutes.");
    setInterval(async () => await checkAirtableRecords(bot), 1000 * 60 * 60);

    scheduleJob("0 9 * * 1,3,5", async () => {
      await sendUnclaimedArt(bot);
    });

    scheduleJob("0 9 * * 6", async () => {
      await sendUnfinishedArt(bot);
    });

    await serve(bot);
  } catch (err) {
    await bot.debug.send(`Error on ready event: ${(err as Error).message}`);
  }
};
