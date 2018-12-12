class DbVideoLister {

    constructor(db, sourcesDb) {
        this.db = db;
        this.sourcesDb = sourcesDb;
    }

    getCache() {
        return this.db.get("video","cache");
    }

    getRootFolders() {
        const result = [{"path":"Movies","name":"Movies","index":true,},{"path":"TV Shows","name":"TV Shows","type":"TV","index":true,},];
        return result;
    }

    async getVideoSources(path) {
        const result = await this.sourcesDb.get.apply(this.sourcesDb, ["video_sources",].concat(path.split("/")));
        delete result.partition;
        delete result.sort;
        return result;
    }
}

module.exports = DbVideoLister;