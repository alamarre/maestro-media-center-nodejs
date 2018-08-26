const TMDB_KEY = process.env.TMDB_KEY;
const MovieDb = require("moviedb-promise");
const normalizedMatch = require("./NormalizedMatch");

class TheMovieDb {
    constructor(db) {
        this.movieDb = new MovieDb(TMDB_KEY);
        this.db = db;
    }

    canRun() {
        return typeof TMDB_KEY === "string"; 
    }

    async searchForMovie(movieName) {
        const response = await this.movieDb.searchMovie({query: movieName,});
        const results = response.results.filter(m => normalizedMatch(m.title, movieName));
        if(results.length === 1) {
            const result = results[0];
            const detailedInfo = await this.movieDb.movieInfo({ id: result.id, });
            let collectionInfo = null;
            if(detailedInfo.belongs_to_collection) {
                const collectionName = detailedInfo.belongs_to_collection.name;
                const collectionDetails = await this.movieDb.collectionInfo({id: detailedInfo.belongs_to_collection.id,});
                const poster = `http://image.tmdb.org/t/p/original/${collectionDetails.poster_path}`;
                collectionInfo = {collectionName, poster: poster, movies: collectionDetails.parts.map(m => m.title),};
                this.db.set(collectionInfo, "collections", collectionName);
            }
            return {"source": "TMDB", collectionInfo,  id: detailedInfo.id, poster: `http://image.tmdb.org/t/p/original/${result.poster_path}`,};
        }
        return {"source": "not found",};
    }

    async searchForTvShow(showName) {
        const response = await this.movieDb.searchTv({query: showName,});
        const results = response.results.filter(m => m.name.toLowerCase() === showName.toLowerCase());
        if(results.length === 1) {
            const result = results[0];
            return {"source": "TMDB", id: result.id, poster: `http://image.tmdb.org/t/p/original/${result.poster_path}`,};
        }
        return {"source": "not found",};
    }
}

module.exports = TheMovieDb;