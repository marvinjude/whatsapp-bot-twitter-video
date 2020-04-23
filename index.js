const WhatsApp = require("@open-wa/wa-automate");
const start = require("./start.js");
const schedule = require("node-schedule");
const DB = require("./db.js");
const fs = require("fs");
const { hoursAgo, logger } = require("./utils");
require("dotenv").config();

WhatsApp.create({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
}).then((client) => start(client));

/*******************************************
 * Everyday at 00:00, delete old Cached files
 *******************************************/
schedule.scheduleJob("0 0 * * *", function () {
  const db = new DB();
  const someTimeAgo = hoursAgo(process.env.HOURS_BEFORE_CACHED_FILE_DELETE);

  const entriesToDelete = db
    .get("entries")
    .filter(({ lastFetched }) => lastFetched <= someTimeAgo);

  for ({ id: tweetId } of entriesToDelete)
    fs.unlink(`${process.env.FILE_CACHE_DIRECTORY}/${tweetId}.mp4`, (error) => {
      if (!error) logger("INFO", `UNLINKED ${tweetId}.mp4`);
      else logger("INFO", `UNABLE TO UNLIK: ${tweetId}.mp4`);
    });
});
