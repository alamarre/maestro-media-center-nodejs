import IDatabase from "./IDatabase";

const UserSpecificDb = require("./impl/UserSpecificDb");

let db = null;
export default (key: string) : IDatabase => {
    if(db === null) {
        db = new UserSpecificDb(key);
    }

    return db;
}