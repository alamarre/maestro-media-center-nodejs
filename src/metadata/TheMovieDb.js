const TMDB_KEY = process.env.TMDB_KEY;
const MovieDb = require("moviedb-promise");

class TheMovieDb {
    constructor() {
        this.movieDb = new MovieDb(TMDB_KEY);
    }

    canRun() {
        return typeof TMDB_KEY === "string"; 
    }

    async searchForMovie(movieName) {
        const response = await this.movieDb.searchMovie({query: movieName,});
        const results = response.results.filter(m => m.title.toLowerCase() === movieName.toLowerCase());
        if(results.length === 1) {
            const result = results[0];
            return {"source": "TMDB", id: result.id, poster: `http://image.tmdb.org/t/p/original/${result.poster_path}`,};
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