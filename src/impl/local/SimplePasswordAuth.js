const uuid = require("uuid/v4");
const ttl = 30 * 24 * 60 * 60 * 1000;

class SimplePasswordAuth {
  constructor(db) {
    this.db = db;
  }
  async getUser(userToken) {
    const user = await this.db.get("user_logins", userToken);
    user.expires = Date.now() + ttl;
    await this.db.set(user, "user_logins", userToken);
    return user;
  }
  async createAuthToken(username, accountId) {
    const token = uuid();
    await this.db.set({ username, accountId, expires: Date.now() + ttl, }, "user_logins", token);
    return token;
  }
}
module.exports = SimplePasswordAuth;
