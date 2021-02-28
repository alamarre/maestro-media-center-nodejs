class S3AndCacheManager {
    constructor(s3CacheManager, cacheToS3) {
        this.s3CacheManager = s3CacheManager;
        this.cacheToS3 = cacheToS3;
    }

    async addMovie(path, rootUrl) {
        const moviePart = path.substring(path.lastIndexOf("/") +1);
        const movieName = moviePart.substring(0, moviePart.lastIndexOf("."));
        await this.cacheToS3.addMovieToS3(moviePart, `${rootUrl}${path}`);
        await this.s3CacheManager.addMovieToCache(movieName);
    }

    async addTvShow(path, rootUrl) {
        if(path.startsWith("/")) {
            path = path.substring(1);
        }
        // skip root folder
        const [, showName, season, episode,] = path.split("/");
        const episodeName = episode.substring(0, episode.lastIndexOf("."));
        await this.cacheToS3.addEpisodeToS3(showName, season, episode, `${rootUrl}${path}`);
        await this.s3CacheManager.addEpisodeToCache(showName, season, episodeName);
    }
}

module.exports = S3AndCacheManager;