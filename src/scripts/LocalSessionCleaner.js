const fs = require("fs");

const SESSION_DIR = __dirname + "/../../db/user_logins";
const EXPIRATION_MS = 1000 * 60 * 60 * 24 * 90;

class LocalSessionCleaner {
    run() {
        for(const file of fs.readdirSync(SESSION_DIR)) {
            const stats = fs.lstatSync(`${SESSION_DIR}/${file}`);
            if(stats.atimeMs < new Date().getTime() - EXPIRATION_MS) {
                console.log(`deleting session file ${file}`);
                fs.unlinkSync(`${SESSION_DIR}/${file}`);
            } else {
                console.log(`session still active ${file}`);
            }
        }
    }
}

module.exports = LocalSessionCleaner;