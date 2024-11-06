const mongoose = require("mongoose");
const { CONFIG } = require("../config");

class Database {
  static _database

  constructor() {
    const dbUrl = CONFIG.mongodb_host
    if (dbUrl) {
      mongoose
        .connect(dbUrl)
        .then(() => console.log("Connected with database"))
        .catch((err) => {
          console.error(
            "Error connecting to database:",
            err
          )
        })
    } else {
      console.error("Database URL is not provided")
    }
  }

  static getInstance() {
    if (!this._database) {
      this._database = new Database()
    }
    return this._database
  }
}

module.exports = Database;
