function mapCacheToPath(cache, currentPath, map, useFull) {
    for(const file of Object.keys(cache.files)) {
        const path = `${currentPath}/${file}`;
        const key = useFull ? path : file;
        map[key] = path;
    }

    for(const folder of Object.keys(cache.folders)) {
        const path = `${currentPath}/${folder}`;
        mapCacheToPath(cache.folders[folder], path, map, useFull);
    }
}

class CacheToS3 {
    constructor(s3, bucket, db) {
        this.s3 = s3;
        this.bucket = bucket;
        this.db = db;
    }

    async addCache(cache, rootFolders, rootUrl) {
        this.cache = this.db.get("video","cache") || {files: {}, folders: {"Movies":{files: {}, folders: {},}, "TV Shows": {files:{}, folders: {},},},};
        let madeChange = false;
        for(const rootFolder of rootFolders) {
            const type = (rootFolder.type || "movies").toLowerCase();
            if(type === "movies") {
                const movies = {};
                mapCacheToPath(cache.folders[rootFolder.name], "", movies, false);
                for(const movie of Object.keys(movies)) {                  
                    madeChange = madeChange || await this.addMovieToS3(movie, `${rootUrl}${rootFolder.name}${movies[movie]}`);
                }
            } else if(type === "tv") {
                const shows = {};
                mapCacheToPath(cache.folders[rootFolder.name], "", shows, true);
                for(const show of Object.keys(shows)) {
                    const [, showName, season, episode,] = show.split("/");
                    madeChange = madeChange || await this.addEpisodeToS3(showName, season, episode, `${rootUrl}${rootFolder.name}${show}`);
                }
            }
        }

        return madeChange;
    }

    async addMovieToS3(name, url) {
        const file = `Movies/${name}`;
        return await this.addUrlToFile(file, url);
    }

    async addEpisodeToS3(show, season, episode, url) {
        const file = `TV Shows/${show}/${season}/${episode}`;
        return await this.addUrlToFile(file, url);
    }

    async addUrlToFile(file, url) {
        let data = {sources: [], subtitles:[],};

        let type;
        if(file.endsWith(".mp4")) {
            type = "sources";
            file = file.substring(0, file.lastIndexOf("."));
        } else if(file.endsWith(".vtt")) {
            type = "subtitles";
            file = file.substring(0, file.lastIndexOf(".vtt"));
        } else {
            return;
        }
        file = file + ".json";
        try {
            const result = await this.s3.getObject({
                Bucket: this.bucket,
                Key: file,
            }).promise();
            data = JSON.parse(result.Body);
        } catch(e) {
            // maybe log
        }

        

        if(!data[type].includes(url) ) {
            data[type].push(url);
            try{
            await this.s3.putObject({
                Bucket: this.bucket,
                Key: file,
                Body: JSON.stringify(data),
            }).promise();
            console.log(this.bucket, file, JSON.stringify(data));
        } catch(e) {
            console.error(e);
        }
        }
    }
}

module.exports = CacheToS3;