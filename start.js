const fs = require("fs");
const DataURI = require("datauri").promise;
const DB = require("./db.js");

const {
  getVideo,
  isTwitterUrl,
  getTweetId,
  fetchFileIntoPath,
} = require("./utils.js");

function start(client) {
  const db = new DB();
  client.onMessage(async (message) => {
    const messageId = message.id;

    if (isTwitterUrl(message.body)) {
      client.reply(message.from, "🔍Extracting Video", messageId);
      client.simulateTyping(message.from, true);

      try {
        const { mediaUrls } = await getVideo(message.body);
        const fileURL = mediaUrls[0].url;
        const tweetId = getTweetId(message.body);
        const possiblePath = `${process.env.FILE_CACHE_DIRECTORY}/${tweetId}.mp4`;

        const fileWasPreviouslyCached = fs.existsSync(possiblePath);

        if (fileWasPreviouslyCached) {
          db.update("entries", tweetId, { lastFetched: Date.now() }).write(); //UPDATE ENTRY IN DB
        } else {
          await fetchFileIntoPath(fileURL, possiblePath); //CACHE FILE

          db.add("entries", {
            id: tweetId,
            createdAt: Date.now(),
            lastFetched: Date.now(),
          }).write(); //ADD ENTRY TO DB
        }

        const fileURI = await DataURI(possiblePath);

        await client.sendFile(
          message.from,
          fileURI,
          process.env.DEFAULT_FILENAME,
          "",
          messageId
        );
        client.simulateTyping(message.from, false);
      } catch (error) {
        console.log(error);
        client.reply(message.from, error, messageId);
        client.simulateTyping(message.from, false);
      }
    }
  });
}

module.exports = start;
