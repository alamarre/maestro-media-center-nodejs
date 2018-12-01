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
    constructor(s3, bucket) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    addCache(cache, rootFolders, rootUrl) {
        for(const rootFolder of rootFolders) {
            const type = (rootFolder.type || "movies").toLowerCase();
            if(type === "movies") {
                const movies = mapCacheToPath(cache.folders[rootFolder.name], "", {}, false);
                for(const movie of Object.keys(movies)) {
                    this.addMovieToS3(movie, `${rootUrl}/${rootFolder.name}${movies[movie]}`);
                }
            } else if(type === "tv") {
                const shows = mapCacheToPath(cache.folders[rootFolder.name], "", {}, true);
                for(const show of Object.keys(shows)) {
                    const [, showName, season, episode,] = show.split("/");
                    this.addEpisodeToS3(showName, season, episode, `${rootUrl}/${rootFolder.name}${show}`);
                }
            }
        }
    }

    async addMovieToS3(name, url) {
        const file = `Movies/${name}.json`;
        await this.addUrlToFile(file, url);
    }

    async addEpisodeToS3(show, season, episode, url) {
        const file = `TV Shows/${show}/${season}/${episode}.json`;
        await this.addUrlToFile(file, url);
    }

    async addUrlToFile(file, url) {
        let data = {sources: [],};

        try {
            const result = await this.s3.getObject({
                Bucket: this.Bucket,
                Key: file,
            }).promise();
            data = JSON.parse(result.Body);
        } catch(e) {
            // maybe log
        }

        if(!data.sources.includes(url)) {
            data.sources.push(url);
            await this.s3.putObject({
                Bucket: this.bucket,
                Key: file,
                Body: JSON.stringify(data),
            });
        }
    }
}

module.exports = CacheToS3;