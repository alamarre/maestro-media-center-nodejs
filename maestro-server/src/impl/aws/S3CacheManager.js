function addToCache(cache, ...parts) {
    let current = cache;
    for(const index in parts) {
        const part = parts[index];
        if(index == parts.length -1) {
            current.files[part] = part;
        } else {
            if(!current.folders[part]) {
                current.folders[part] = {files:{}, folders:{},};
            }
            current = current.folders[part];
        }
    }
}

function removeFromCache(cache, ...parts) {
    let current = cache;
    for(const index in parts) {
        const part = parts[index];
        if(index == parts.length -1) {
            delete current.files[part];
        } else {
            if(!current.folders[part]) {
                current.folders[part] = {files:{}, folders:{},};
            }
            current = current.folders[part];
        }
    }
}

class S3CacheManager {
    constructor({s3, bucket, db,}) {
        this.s3 = s3;
        this.bucket = bucket;
        this.db = db;
    }

    async buildAndStoreCache() {
        const cache = await this.buildCache();
        await this.storeCache(cache);
    }

    async storeCache(cache) {
        await this.db.set(cache, "video","cache");
    }

    async addMovieToCache(movieName) {
        const cache = await this.db.get("video","cache");
        cache.folders["Movies"].files[movieName] = movieName;
        await this.db.set(cache, "video","cache");
    }

    async addEpisodeToCache(show, season, episode) {
        const cache = await this.db.get("video","cache");
        const current = cache.folders["TV Shows"];
        addToCache(current, show, season, episode);
        await this.db.set(cache, "video","cache");
    }

    async removeMovieFromCache(movieName) {
        const cache = await this.db.get("video","cache");
        delete cache.folders["Movies"].files[movieName];
        await this.db.set(cache, "video","cache");
    }

    async removeEpisodeFromCache(show, season, episode) {
        const cache = await this.db.get("video","cache");
        const current = cache.folders["TV Shows"];
        removeFromCache(current, show, season, episode);
        await this.db.set(cache, "video","cache");
    }

    async buildCache() {
        // AWS cache rule, no nested folders for movies, tv shows are Show Name -> Season -> Episode
        this.root = {files: {}, folders: {"Movies":{files: {}, folders: {},}, "TV Shows": {files:{}, folders: {},},},};
        let results = await this.s3.listObjectsV2({
            Bucket: this.bucket,
        }).promise();

        while(results.Contents.length > 0) {
            for(const file of results.Contents ) {
                const key = file.Key;
                const parts = key.split("/");
                if(parts.length < 2) {
                    console.error(`${key} is not two parts. Unacceptable.`);
                    continue;
                }

                const folder = parts[0];
                let fileName = parts[1];
 
                if(!this.root.folders[folder]) {
                    console.error(`${folder} is not considered a valid folder. Unacceptable.`);
                    continue;
                }
                
                if(parts.length === 4 && folder === "TV Shows") {
                    const show = fileName;
                    const season = parts[2];
                    let episode = parts[3];
                    episode = episode.substring(0, episode.indexOf(".json"));
                    const current = this.root.folders["TV Shows"];
                    addToCache(current, show, season, episode);
                    
                } else if(parts.length === 2) {
                    fileName = fileName.substring(0, fileName.indexOf(".json"));
                    this.root.folders[folder].files[fileName] = fileName;
                }
            }
            results = await this.s3.listObjectsV2({
                Bucket: this.bucket,
                StartAfter: results.Contents[results.Contents.length -1].Key,
            }).promise();
        }
        return this.root;
    }

    // path should be Movies/{{movieName}} or TV Shows/{{Show}}/{{Season}}/{{Episode Name}}
    async getVideoLocation(path) {
        const data = await this.s3.getObject({
            Bucket: this.bucket,
            Key: `${path}.json`,
        }).promise();

        return JSON.parse(data.Body);
    }
}

module.exports = S3CacheManager;