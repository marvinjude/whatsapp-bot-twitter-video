const fs = require("fs");
require("dotenv").config();

const cacheDir = `./${process.env.FILE_CACHE_DIRECTORY}`;
const dbFile = "./db.json";

const defaultDBContent = {
  entries: [],
};

if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

const DBFileIsEmpty = fs.readFileSync(dbFile, "utf-8").trim().length === 0;

if (!fs.existsSync(dbFile) || DBFileIsEmpty)
  fs.writeFileSync(dbFile, JSON.stringify(defaultDBContent), "utf-8");
