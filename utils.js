const Twitt = require("twitter");
const cache = require("memory-cache");
const fs = require("fs");
const fetch = require("node-fetch");

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

function getVideo(tweetURL) {
  const twittOpts = {
    tweet_mode: "extended",
  };
  let memCache = new cache.Cache();
  const isThisATwitterURL = isTwitterUrl(tweetURL);

  const tweetId = getTweetId(tweetURL);

  if (!isThisATwitterURL) Promise.reject("This isn't a twitter URL");

  /**Return caached response for this tweet id if available */
  let cacheContent = memCache.get(tweetId);
  if (cacheContent) return Promise.resolve(cacheContent);

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

            /**Cache the fucking API response for this tweet ID */
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
};
