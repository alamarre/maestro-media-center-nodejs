import IUserManagement from "../../interfaces/IUserManagement"
import ISimpleDb from "../../interfaces/ISimpleDb";

const uuid = require('uuid/v4');

var fs = require('fs');

class SimplePasswordAuth implements IUserManagement {

    private db : ISimpleDb;

    constructor(db: ISimpleDb) {
        this.db = db;
    }

    getUsername(userToken: string): string | null {
        let username : string | null = this.db.get("user_logins", userToken);
        return username;
    }

    createAuthToken(username: string): string {
        let token : string = uuid();
        this.db.set(username, "user_logins", token);
        return token;
    }

}

export default SimplePasswordAuth;