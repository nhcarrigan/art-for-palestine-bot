import { ExtendedClient } from "../../interface/ExtendedClient";

/**
 * Caches the messages from a specific channel. This should be done to ensure
 * all donation + delivery messages are cached and reaction payloads will be received.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 * @param {string} channelId The ID of the channel to cache.
 */
export const fetchMessages = async (bot: ExtendedClient, channelId: string) => {
  try {
    await bot.debug.send(`Caching messages for ${channelId}`);
    const guild = await bot.guilds.fetch("1172566005311090798");
    const channel = await guild.channels.fetch(channelId);

    if (!channel || !("send" in channel)) {
      await bot.debug.send(`Failed to load <#${channelId}>~!`);
      return;
    }

    let before: string | undefined = undefined;

    await bot.debug.send("Fetching first wave of messages.");
    let messages = await channel.messages.fetch({ limit: 100 });

    while (messages.size === 100) {
      before = messages.last()?.id;
      if (!before) {
        await bot.debug.send("Failed to get oldest messages from batch.");
        break;
      }
      await bot.debug.send(
        `Found more than 100 messages. Fetching next batch from ${before}`
      );
      messages = await channel.messages.fetch({ limit: 100, before });
    }
  } catch (err) {
    await bot.debug.send({ content: `` });
  }
};
