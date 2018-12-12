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

class CacheToDynamo {
    constructor(db) {
        this.db = db;
    }

    async addCache(cache, rootFolders, rootUrl) {
        for(const rootFolder of rootFolders) {
            const type = (rootFolder.type || "movies").toLowerCase();
            if(type === "movies") {
                const movies = {};
                mapCacheToPath(cache.folders[rootFolder.name], "", movies, false);
                for(const movie of Object.keys(movies)) {                  
                    await this.addMovie(movie, `${rootUrl}${rootFolder.name}${movies[movie]}`);
                }
            } else if(type === "tv") {
                const shows = {};
                mapCacheToPath(cache.folders[rootFolder.name], "", shows, true);
                for(const show of Object.keys(shows)) {
                    const [, showName, season, episode,] = show.split("/");
                    await this.addEpisode(showName, season, episode, `${rootUrl}${rootFolder.name}${show}`);
                }
            }
        }
    }

    async addMovie(name, url) {
        const file = `Movies/${name}`;
        return await this.addUrlToFile(file, url);
    }

    async addEpisode(show, season, episode, url) {
        const file = `TV Shows/${show}/${season}/${episode}`;
        return await this.addUrlToFile(file, url);
    }

    async addUrlToFile(file, url) {
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
        await this.db.addToStringSet([url,], type, "video_sources",file);
    }
}

module.exports = CacheToDynamo;