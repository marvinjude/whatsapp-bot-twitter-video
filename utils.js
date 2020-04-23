const Twitt = require("twitter");
const cache = require("memory-cache");
const fs = require("fs");

require("dotenv").config();

const twitter = new Twitt({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  access_token_key: process.env.ACCESS_TOKEN_KEY,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
});

const isTwitterUrl = (URL) =>
  /https?:\/\/twitter.com\/[0-9-a-zA-Z_]{1,20}\/status\/([0-9]*)/.test(URL);

const getTweetId = (tweetURL) => {
  const tweetIdwithQs = tweetURL.split("/")[tweetURL.split("/").length - 1];
  return tweetIdwithQs.split("?")[0];
};

const logger = (type, description) =>
  void console.log(`${type}: ${description}`);

const hoursAgo = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.getTime();
};

function getVideo(tweetURL) {
  const twittOpts = { tweet_mode: "extended" };

  const memCache = new cache.Cache();

  const tweetId = getTweetId(tweetURL);

  if (!isTwitterUrl(tweetURL)) Promise.reject("This isn't a twitter URL");

  /**
     Return cached response for this tweet id if available
   */

  const cacheContent = memCache.get(tweetId);

  if (cacheContent) {
    logger("INFO", `Responded from cache for ${tweetId}`);
    return Promise.resolve(cacheContent);
  }

  return new Promise((resolve, reject) => {
    twitter.get(
      `statuses/show/${tweetId}`,
      twittOpts,
      (error, tweetData, response) => {
        if (error) {
          reject(error);
        } else {
          const tweetHasVideo =
            tweetData.extended_entities &&
            tweetData.extended_entities.media[0].type == "video";

          if (tweetHasVideo) {
            const mediaUrls = tweetData.extended_entities.media[0].video_info.variants.filter(
              (file) => file.content_type == "video/mp4"
            );
            
            logger("INFO", `caching response for tweet id ${tweetId}`);
            /**Cache the API response for this tweet ID */
            memCache.put(tweetId, { response, mediaUrls }, 3600000);

            resolve({ response, mediaUrls });
          } else {
            reject("This tweet contains no video");
          }
        }
      }
    );
  });
}

/*************************************
 * Adds A remote file to a local path
 *************************************/
const fetchFileIntoPath = async (url, path) => {
  const res = await fetch(url);
  const fileStream = fs.createWriteStream(path);

  return new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on("error", (err) => {
      reject(err);
    });
    fileStream.on("finish", function () {
      resolve();
    });
  });
};

module.exports = {
  fetchFileIntoPath,
  getVideo,
  isTwitterUrl,
  getTweetId,
  logger,
  hoursAgo,
};
