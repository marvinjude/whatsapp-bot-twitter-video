const fileContent = require("./db.json");
const fs = require("fs");

class DB {
  constructor() {
    this.content = fileContent;
    this.temp = null;
  }

  getState() {
    return this.content;
  }

  get(key) {
    return this.content[key];
  }

  update(fieldToUpdate, itemId, newContent) {
    const field = this.content[fieldToUpdate];

    this.temp = {
      ...this.content,
      [fieldToUpdate]: field.map((item) => {
        return item.id == itemId ? { ...item, ...newContent } : item;
      }),
    };

    return this;
  }

  add(fieldToUpdate, content) {
    const field = this.content[fieldToUpdate];

    this.temp = {
      ...this.content,
      [fieldToUpdate]: [...field, content],
    };

    return this;
  }

  write() {
    fs.writeFileSync("./db.json", JSON.stringify(this.temp));
  }
}

module.exports = DB;
