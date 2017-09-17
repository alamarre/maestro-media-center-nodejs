const uuid = require('uuid/v4');
var fs = require('fs');
class SimplePasswordAuth {
    constructor(db) {
        this.db = db;
    }
    getUsername(userToken) {
        let username = this.db.get("user_logins", userToken);
        return username;
    }
    createAuthToken(username) {
        let token = uuid();
        this.db.set(username, "user_logins", token);
        return token;
    }
}
export default SimplePasswordAuth;