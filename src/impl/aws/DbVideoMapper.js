class DbVideoLister {

    constructor(db) {
        this.db = db;
    }

    getCache() {
        return this.db.get("video_cache");
    }

    getRootFolders() {
        const result = [{"path":"Movies","name":"Movies","index":true,},{"path":"TV Shows","name":"TV Shows","type":"TV","index":true,},];
        return result;
    }
}

module.exports = DbVideoLister;