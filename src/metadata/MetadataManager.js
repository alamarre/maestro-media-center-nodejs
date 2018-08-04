class MetadataManager {
    constructor(db) {
        this.db = db;
    }

    getTvShowMetadata(showName) {
        return this.db.get("metadata", "tv", "show", showName);
    }

    getMovieMetadata(movieName) {
        return this.db.get("metadata", "movie", movieName);
    }

    getMovienameFromPath(path) {
        const parts = path.split("/");
        const fileName = parts[parts.length -1];
        const movieName = fileName.substring(0, fileName.lastIndexOf("."));
        return movieName;
    }

    saveMovieMetadata(movieName, metadata) {
        this.db.set(metadata, "metadata", "movie", movieName);
    }

    saveTvShowMetadata(showName, metadata) {
        this.db.set(metadata, "metadata", "tv", "show", showName);
    }
}

module.exports = MetadataManager;