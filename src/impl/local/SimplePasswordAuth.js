const uuid = require("uuid/v4");

class SimplePasswordAuth {
    constructor(db) {
        this.db = db;
    }
    getUser(userToken) {
        const user = this.db.get("user_logins", userToken);
        return user;
    }
    createAuthToken(username, accountId) {
        const token = uuid();
        this.db.set({username, accountId,}, "user_logins", token);
        return token;
    }
}
module.exports = SimplePasswordAuth;