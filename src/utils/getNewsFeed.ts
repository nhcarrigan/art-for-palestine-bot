import { ExtendedClient } from "../interface/ExtendedClient";

const getHeadlineArticle = async (bot: ExtendedClient) => {
  try {
    const req = await fetch(
      "https://www.aljazeera.com/graphql?wp-site=aje&operationName=ArchipelagoBreakingTickerQuery&variables=%7B%7D&extensions=%7B%7D",
      {
        method: "GET",
        headers: {
          "Wp-site": "Naomi's Art for Palestine Bot",
        },
      }
    );
    const res = (await req.json()) as {
      data: { breakingNews: { post: string; link: string } };
    };
    return res.data.breakingNews;
  } catch (err) {
    await bot.debug.send(
      `Error in fetching latest news post: ${(err as Error).message}`
    );
    return null;
  }
};

const getArticleChildren = async (bot: ExtendedClient, slug: string) => {
  try {
    const req = await fetch(
      `https://www.aljazeera.com/graphql?wp-site=aje&operationName=SingleLiveBlogChildrensQuery&variables=%7B%22postName%22%3A%22${slug}%22%7D&extensions=%7B%7D`,
      {
        method: "GET",
        headers: {
          "Wp-site": "Naomi's Art for Palestine Bot",
        },
      }
    );
    const res = (await req.json()) as {
      data: {
        article: {
          children: number[];
        };
      };
    };
    return res.data.article.children;
  } catch (err) {
    await bot.debug.send(
      `Error in fetching article children: ${(err as Error).message}`
    );
    return null;
  }
};

const getArticleInfo = async (bot: ExtendedClient, postId: number) => {
  try {
    const req = await fetch(
      `https://www.aljazeera.com/graphql?wp-site=aje&operationName=LiveBlogUpdateQuery&variables=%7B%22postID%22%3A${postId}%2C%22postType%22%3A%22liveblog-update%22%2C%22preview%22%3A%22%22%2C%22isAmp%22%3Afalse%7D&extensions=%7B%7D`
    );
    const res = (await req.json()) as {
      data: {
        posts: {
          link: string;
          title: string;
          id: string;
        };
      };
    };
    return res.data.posts;
  } catch (err) {
    await bot.debug.send(
      `Error in fetching article info: ${(err as Error).message}`
    );
    return null;
  }
};

/**
 * Fetches the GraphQL feed from Aljazeera's Palestine live feed.
 *
 * @param {ExtendedClient} bot The bot's Discord instance.
 */
export const getNewsFeed = async (bot: ExtendedClient) => {
  try {
    const headline = await getHeadlineArticle(bot);
    if (!headline) {
      return;
    }
    const children = await getArticleChildren(
      bot,
      headline.link.split("/").slice(-1).join()
    );
    if (!children) {
      return;
    }
    if (!bot.lastArticle) {
      bot.lastArticle = children[0];
      await bot.debug.send(
        `No cache found. Caching ${children[0]} and skipping run.`
      );
      return;
    }
    const laterChildren = children.slice(0, children.indexOf(bot.lastArticle));
    bot.lastArticle = children[0];
    for (const postId of laterChildren) {
      const article = await getArticleInfo(bot, postId);
      if (!article) {
        continue;
      }
      await bot.news.send(
        `[${article.title}](https://www.aljazeera.com${article.link})`
      );
    }
  } catch (err) {
    await bot.debug.send(
      `Error in fetching news feed: ${(err as Error).message}`
    );
  }
};
