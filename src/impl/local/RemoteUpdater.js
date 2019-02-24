const fetch = require("node-fetch");
const rootUrl = process.env.ROOT_VIDEO_URL;
const REMOTE_FILE_HANDLER = process.env.REMOTE_FILE_HANDLER; 

class RemoteUpdater {
    constructor(cache) {
        this.cache = cache;
    }

    listen() {
        if(REMOTE_FILE_HANDLER) {
            this.cache.listenForChanges(async (rootFolderName, relativePath, scanned) => this.handleEvent(rootFolderName, relativePath, scanned));
        }
    }

    async handleEvent(rootFolderName, relativePath, scanned) {
        // we only want files detected after the initial scan
        if(scanned) {
            const rootFolders = await this.cache.getRootFolders();
            const rootFolder = rootFolders.filter(r => r.name === rootFolderName)[0];
            const type = (rootFolder.type || "movie").toLowerCase();
            const path = `${rootFolderName}/${relativePath}`;
            await fetch(REMOTE_FILE_HANDLER, {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({rootUrl, path, type,}),
            });
        }
    }

}

module.exports = RemoteUpdater;