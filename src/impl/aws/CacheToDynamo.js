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

function hasMovie(cache, movieName) {
    movieName = movieName.substring(0, movieName.lastIndexOf("."));
    return (cache && cache.folders && (typeof cache.folders["Movies"].files[movieName]) !== "undefined");
}

function hasTvEpisode(cache, show, season, episode) {
    if(!cache) {
        return false;
    }

    const showFolder = cache.folders["TV Shows"].folders[show];
    if(!showFolder) {
        return false;
    }

    const seasonFolder = showFolder.folders[season];
    if(!seasonFolder) {
        return false;
    }

    episode = episode.substring(0, episode.lastIndexOf("."));
    return (typeof seasonFolder.files[episode]) !== "undefined";
}

class CacheToDynamo {
    constructor(db, referenceCache) {
        this.db = db;
        this.referenceCache = referenceCache;
    }

    async addCache(cache, rootFolders, rootUrl) {
        for(const rootFolder of rootFolders) {
            const type = (rootFolder.type || "movies").toLowerCase();
            if(type === "movies") {
                const movies = {};
                mapCacheToPath(cache.folders[rootFolder.name], "", movies, false);
                for(const movie of Object.keys(movies)) {
                    if(!hasMovie(this.referenceCache, movie)) {
                        await this.addMovie(movie, `${rootUrl}${rootFolder.name}${movies[movie]}`);
                    }
                }
            } else if(type === "tv") {
                const shows = {};
                mapCacheToPath(cache.folders[rootFolder.name], "", shows, true);
                for(const show of Object.keys(shows)) {
                    const [, showName, season, episode,] = show.split("/");
                    if(showName.startsWith("Avatar") && season === "Season 3") {
                        console.log(episode);
                    }
                    if(!hasTvEpisode(this.referenceCache, showName, season, episode)) {
                        await this.addEpisode(showName, season, episode, `${rootUrl}${rootFolder.name}${show}`);
                    }
                }
            }
        }
    }

    async addMovie(name, url) {
        const file = `Movies/${name}`;
        return await this.addUrlToFile(file, url);
    }

    async deleteMovie(name, url) {
      const file = `Movies/${name}`;
      return await this.removeUrlFromFile(file, url);
    }

    async addEpisode(show, season, episode, url) {
        const file = `TV Shows/${show}/${season}/${episode}`;
        return await this.addUrlToFile(file, url);
    }

    async deleteEpisode(show, season, episode, url) {
      const file = `TV Shows/${show}/${season}/${episode}`;
      return await this.removeUrlFromFile(file, url);
    }

    async removeUrlFromFile(file, url) {
      let type;
      if(file.endsWith(".mp4")) {
          type = "sources";
          file = file.substring(0, file.lastIndexOf("."));
      } else if(file.endsWith(".vtt")) {
          type = "subtitles";
          file = file.substring(0, file.lastIndexOf(".vtt"));
          const forcedIndex = file.lastIndexOf("en.forced");
          if(forcedIndex > 0) {
            file = file.substring(0, forcedIndex);
          }
      } else {
          return;
      }
      await this.db.removeStringFromSet([url,], type, "video_sources", file);
      const sourceInfo = await this.db.get("video_sources", file);
      if(!(sourceInfo.sources && sourceInfo.sources.length > 0) &&
        !(sourceInfo.subtitles && sourceInfo.subtitles.length > 0)) {
        await this.db.delete("video_sources", file);
      }
  }

    async addUrlToFile(file, url) {
        let type;
        if(file.endsWith(".mp4")) {
            type = "sources";
            file = file.substring(0, file.lastIndexOf("."));
        } else if(file.endsWith(".vtt")) {
            type = "subtitles";
            file = file.substring(0, file.lastIndexOf(".vtt"));
            const forcedIndex = file.lastIndexOf("en.forced");
            if(forcedIndex > 0) {
              file = file.substring(0, forcedIndex);
            }
        } else {
            return;
        }
        await this.db.addToStringSet([url,], type, "video_sources",file);
    }
}

module.exports = CacheToDynamo;
