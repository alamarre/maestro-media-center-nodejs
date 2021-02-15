const fetch = require("node-fetch");
const rootUrl = process.env.ROOT_VIDEO_URL;
const REMOTE_FILE_HANDLER = process.env.REMOTE_FILE_HANDLER;
const PREVENT_DELETES = !process.env.PREVENT_DELETES;

class RemoteUpdater {
    constructor(cache) {
        this.cache = cache;
        this.queue = [];
        setInterval(() => this.processQueue(), 5000);
    }

    listen() {
        if(REMOTE_FILE_HANDLER) {
            this.cache.listenForChanges(
              async (rootFolderName, relativePath, scanned) => this.handleEvent(rootFolderName, relativePath, scanned, "POST"),
              (rootFolderName, relativePath, scanned) => this.handleEvent(rootFolderName, relativePath, scanned, "DELETE")
            );
        }
    }

    async handleEvent(rootFolderName, relativePath, scanned, method) {
        // we only want files detected after the initial scan
        if(scanned) {
            const rootFolders = await this.cache.getRootFolders();
            const rootFolder = rootFolders.filter(r => r.name === rootFolderName)[0];
            const type = (rootFolder.type || "movie").toLowerCase();
            const path = `${rootFolderName}/${relativePath}`;

            if(method != "DELETE" || !PREVENT_DELETES) {
              this.queue.push({rootUrl, path, type, method,});
            }

        }
    }

    async processQueue() {
        if(this.queue.length > 0) {
          const message = this.queue[0];
          const {rootUrl, path, type,} = message;
          try {
            await fetch(REMOTE_FILE_HANDLER, {
              method: message.method,
              headers: {
                  "Accept": "application/json",
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({rootUrl, path, type,}),
          });
          this.queue = this.queue.slice(1);
          console.log(`successful ${message.method} for`, message.path);
        } catch(e) {
          console.log("failed to update ", message.path);
        }
      }
    }

}

module.exports = RemoteUpdater;
