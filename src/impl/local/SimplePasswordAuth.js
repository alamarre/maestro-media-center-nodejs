const uuid = require("uuid/v4");
const ttl = 30 * 24 * 60 * 60;
const resetPercent = 0.1;
// if we cross the threshold, 10% of the time to expiration we update
const resetTime = ttl * (1 - resetPercent);

class SimplePasswordAuth {
  constructor(db) {
    this.db = db;
  }
  async getUser(userToken) {
    const user = await this.db.get("user_logins", userToken);

    if (!user.expires || user.expires < (Date.now() / 1000) + resetTime) {
      user.expires = Date.now() / 1000 + ttl;
      await this.db.set(user, "user_logins", userToken);
    }

    return user;
  }
  async createAuthToken(username, accountId) {
    const token = uuid();
    await this.db.set({ username, accountId, expires: Date.now() + ttl, }, "user_logins", token);
    return token;
  }
}
module.exports = SimplePasswordAuth;
