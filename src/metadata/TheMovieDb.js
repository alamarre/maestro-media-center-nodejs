const TMDB_KEY = process.env.TMDB_KEY;
const MovieDb = require("moviedb-promise");
const normalizedMatch = require("./NormalizedMatch");
const pattern1 = /(S[0-9]{2})?\s*EP?([0-9]{2})/i;
const pattern2 = /[0-9]{1,2}x([0-9]{2})/i;
const pattern3 = /(\s|[.])[1-9]([0-9]{2})(\s|[.])/i;

const IMAGE_ROOT = "http://image.tmdb.org/t/p/original";

function getEpisodeNumber(episode) {
    let episodeNumber;
    let result = pattern1.exec(episode);
    if(!result || result.length !== 3) {
        result = pattern2.exec(episode);
        if(!result || result.length !== 2) {
            result = pattern3.exec(episode);
            if(!result || result.length !== 4) {
                console.log("couldn't parse episode number from", episode);
                return null;
            } else {
                episodeNumber = result[2];
            }
        }
        else {
            episodeNumber = result[1];
        }
    } else {
        episodeNumber = result[2];
    }
    return episodeNumber;
}

class TheMovieDb {
    constructor(db) {
        this.movieDb = new MovieDb(TMDB_KEY);
        this.db = db;
    }

    canRun() {
        return typeof TMDB_KEY === "string"; 
    }

    async searchForMovie(movieName) {
        console.log("searching tmdb for movie", movieName);
        const response = await this.movieDb.searchMovie({query: movieName,});
        const results = response.results.filter(m => normalizedMatch(m.title, movieName));
        if(results.length === 1) {
            const result = results[0];
            const detailedInfo = await this.movieDb.movieInfo({ id: result.id, });
            let collectionInfo = null;
            if(detailedInfo.belongs_to_collection) {
                const collectionName = detailedInfo.belongs_to_collection.name;
                const collectionDetails = await this.movieDb.collectionInfo({id: detailedInfo.belongs_to_collection.id,});
                const poster = collectionDetails.poster_path ? `${IMAGE_ROOT}${collectionDetails.poster_path}` : null;
                collectionInfo = {collectionName, poster: poster, movies: collectionDetails.parts.map(m => m.title),};
                await this.db.set(collectionInfo, "collections", collectionName);
            }
            const poster = result.poster_path ? `${IMAGE_ROOT}${result.poster_path}` : null;
            return {"source": "TMDB", collectionInfo, overview: detailedInfo.overview, id: detailedInfo.id, poster,};
        } else if (response.results.length > 1) {
            await this.db.set({value: JSON.stringify({results: response.results,}),},"possible_metadata", "movie", movieName);
        }
        return {"source": "not found",};
    }

    async searchForTvShow(showName) {
        console.log("searching tmdb for show", showName);
        const response = await this.movieDb.searchTv({query: showName,});
        const results = response.results.filter(m => m.name.toLowerCase() === showName.toLowerCase());
        if(results.length === 1) {
            const result = results[0];
            const poster = result.poster_path ? `${IMAGE_ROOT}${result.poster_path}` : null;
            return {"source": "TMDB", id: result.id, poster,};
        } else if (results.length > 1) {
            await this.db.set({value: JSON.stringify(results),},"possible_metadata", "tv", "show", showName);
        }
        return {"source": "not found",};
    }

    async getEpisodeInfo(showMetadata, season, episode) {
        const season_number = season.substring("Season ".length);
        const episode_number = getEpisodeNumber(episode);
        if(episode_number) {
            const result = await this.movieDb.tvEpisodeInfo( {id:showMetadata.id, season_number, episode_number,});
            if(result) {
                const poster = result.still_path ? `${IMAGE_ROOT}${result.still_path}` : null;
                return {"source": "TMDB", id: result.id, overview: result.overview, poster,};
            }
        }
        return {"source": "not found",};
    }
}

module.exports = TheMovieDb;