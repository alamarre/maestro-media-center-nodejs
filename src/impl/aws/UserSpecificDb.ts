const als = require("async-local-storage");

export default class UserSpecificDb {
  constructor(private key) {
    this.key = key || "db";
  }

  getDb() {
    return als.get(this.key);
  }

  async get(...args) {
    const db = this.getDb();
    return await db.get.apply(db, args);
  }

  async set(...args) {
    const db = this.getDb();
    return await db.set.apply(db, args);
  }

  async delete(...args) {
    const db = this.getDb();
    return await db.delete.apply(db, args);
  }

  async addToStringSet(...args) {
    const db = this.getDb();
    return await db.addToStringSet.apply(db, args);
  }

  async removeStringFromSet(...args) {
    const db = this.getDb();
    return await db.removeStringFromSet.apply(db, args);
  }

  async list(...prefix) {
    const db = this.getDb();
    return await db.list.apply(db, prefix);
  }
}
