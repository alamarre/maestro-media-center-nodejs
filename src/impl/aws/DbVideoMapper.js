class DbVideoLister {

    constructor(db, sourcesDb) {
        this.db = db;
        this.sourcesDb = sourcesDb;
    }

    getCache() {
        return this.db.get("video","cache");
    }

    async listFolders(path) {
        const cache = await this.db.get("video","cache");
        if(path.startsWith("/")) {
            path = path.substring("1");
        }
        const parts = path.split("/");
        let current = cache;
        for(let i=0; i<parts.length; i++) {
            if(current.folders[parts[i]]) {
                current = current.folders[parts[i]];
            } else {
                return {files:[], folders:[],};
            }
        }
        return { 
            files: Object.keys(current.files),
            folders: Object.keys(current.folders),
        };
    }

    getRootFolders() {
        const result = [{"path":"Movies","name":"Movies","index":true,},{"path":"TV Shows","name":"TV Shows","type":"TV","index":true,},];
        return result;
    }

    async getVideoSources(path) {
        if(path.startsWith("/")) {
            path = path.substring(1);
        }
        const result = await this.sourcesDb.get.apply(this.sourcesDb, ["video_sources",].concat(path.split("/")));
        delete result.partition;
        delete result.sort;
        return result;
    }
}

module.exports = DbVideoLister;