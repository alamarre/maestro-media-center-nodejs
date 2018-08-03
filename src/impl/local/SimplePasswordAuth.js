const uuid = require("uuid/v4");

class SimplePasswordAuth {
    constructor(db) {
        this.db = db;
    }
    getUsername(userToken) {
        const username = this.db.get("user_logins", userToken);
        return username;
    }
    createAuthToken(username) {
        const token = uuid();
        this.db.set(username, "user_logins", token);
        return token;
    }
}
module.exports = SimplePasswordAuth;