import Parser from "rss-parser";

import { ExtendedClient } from "../interface/ExtendedClient";

const keywords = [
  "palestine",
  "gaza",
  "israel",
  "palestinian",
  "ceasefire",
  "idf",
  "israli",
];

/**
 * Fetches the RSS feed from Aljazeera, filters for Palestine-related articles.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 */
export const getNewsFeed = async (bot: ExtendedClient) => {
  try {
    const parser = new Parser();
    const feed = await parser.parseURL(
      "https://www.aljazeera.com/xml/rss/all.xml"
    );
    const filtered = feed.items.filter((i) =>
      keywords.some((word) => i.title?.toLowerCase().includes(word))
    );
    if (!filtered[0]) {
      await bot.debug.send({
        content:
          "Error fetching articles and applying filter. Please investigate feed manually.",
      });
      return;
    }
    if (!bot.lastArticle) {
      bot.lastArticle = filtered[0].link || "";
      await bot.debug.send({
        content: `Last article not cached. Caching ${filtered[0].title}, skipping this run.`,
      });
      return;
    }
    const index = filtered.findIndex((i) => i.link === bot.lastArticle);
    if (index === -1) {
      await bot.debug.send({
        content: "Unable to find cached article in feed.",
      });
      return;
    }
    const sliced = filtered.slice(0, index);
    if (!sliced.length) {
      return;
    }
    for (const article of sliced) {
      if (!article.title || !article.link) {
        continue;
      }
      await bot.news.send({
        content: `[${article.title}](${article.link})`,
      });
    }
  } catch (err) {
    await bot.debug.send(
      `Error in fetching news feed: ${(err as Error).message}`
    );
  }
};
