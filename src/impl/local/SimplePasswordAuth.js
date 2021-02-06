const uuid = require("uuid/v4");
const envOr = require("env-or");
const ttl = envOr("LOGIN_EXPIRATION", 12 * 30 * 24 * 60 * 60);
const resetPercent = 0.1;
// if we cross the threshold, 10% of the time to expiration we update
const resetTime = ttl * (1 - resetPercent);

const ALLOW_ADMIN_READONLY = process.env.ALLOW_ADMIN_READONLY;

class SimplePasswordAuth {
  constructor(db) {
    this.db = db;
  }
  async getUser(userToken) {
    const user = await this.db.get("user_logins", userToken);
    if(user == null) {
      if(ALLOW_ADMIN_READONLY) {
        return await this.getAdminUser(userToken);
      }
      return null;
    }

    if (!user.expires || user.expires < (Date.now() / 1000) + resetTime) {
      user.expires = Math.floor(Date.now() / 1000 + ttl);
      await this.db.set(user, "user_logins", userToken);
    }

    return user;
  }

  async getAdminUser(userToken) {
    const user = await this.db.get("admin_auth", "user_logins", userToken);
    if (!user.expires || user.expires < (Date.now() / 1000) + resetTime) {
      user.expires = Math.floor(Date.now() / 1000 + ttl);
      await this.db.set(user, "user_logins", userToken);
    }
    user.readonly = true;
    return user;
  }
  async createAuthToken(username, accountId) {
    const token = uuid();
    await this.db.set({ username, accountId, expires: Date.now()/1000 + ttl, }, "user_logins", token);
    return token;
  }
}
module.exports = SimplePasswordAuth;
