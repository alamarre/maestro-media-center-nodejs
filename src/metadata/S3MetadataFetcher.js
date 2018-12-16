const fetch = require("node-fetch");

class MetadataFetcher {
    constructor(s3, imageBucket, metadataManager, metadataFetcher) {
        this.s3 = s3;
        this.imageBucket = imageBucket;
        this.metadataManager = metadataManager;
        this.metadataFetcher = metadataFetcher;
    }

    async addTvShow(showName, season, episode) {
        let data = await this.metadataManager.getTvShowMetadata(showName);
        if(!data) {
            const metadata = await this.metadataFetcher.searchForTvShow(showName);
            if(metadata.poster) {
                console.log("fetching poster", metadata.poster);
                const res = await fetch(metadata.poster);
                const file = `tv/show/${showName}.jpg`;
                await this.s3.putObject({
                    Bucket: this.imageBucket,
                    Key: file,
                    Body: res.body,
                    ContentLength: res.headers.get("content-length"),
                    ContentType: res.headers.get("content-type"),
                }).promise();
            }
            await this.metadataManager.saveTvShowMetadata(showName, metadata);
            data = metadata;
        }

        if(data && data.id) {
            const episodeData = await this.metadataManager.getTvEpisodeMetadata(showName, season, episode);
            if(!episodeData) {
                const episodeMetadata = await this.metadataFetcher.getEpisodeInfo(data, season, episode);
                if(episodeMetadata.poster) {
                    console.log("fetching poster", episodeMetadata.poster);
                    const res = await fetch(episodeMetadata.poster);
                    const file = `tv/episode/${showName}/${season}/${episode}.jpg`;
                    await this.s3.putObject({
                        Bucket: this.imageBucket,
                        Key: file,
                        Body: res.body,
                        ContentLength: res.headers.get("content-length"),
                        ContentType: res.headers.get("content-type"),
                    }).promise();
                }
                await this.metadataManager.saveTvEpisodeMetadata(showName, season, episode, episodeMetadata);
            }
        }
    }

    async addMovie(movieName) {
        const data = await this.metadataManager.getMovieMetadata(movieName);
        if(!data) {
            const metadata = await this.metadataFetcher.searchForMovie(movieName);
            if(metadata.poster) {
                console.log("fetching poster", metadata.poster);
                const res = await fetch(metadata.poster);
                const file = `movies/${movieName}.jpg`;
                await this.s3.putObject({
                    Bucket: this.imageBucket,
                    Key: file,
                    Body: res.body,
                    ContentLength: res.headers.get("content-length"),
                    ContentType: res.headers.get("content-type"),
                }).promise();
            }

            if(metadata.collectionInfo && metadata.collectionInfo.poster) {
                console.log("fetching poster", metadata.collectionInfo.poster);
                const res = await fetch(metadata.collectionInfo.poster);
                const file = `collections/${metadata.collectionInfo.collectionName}.jpg`;
                await this.s3.putObject({
                    Bucket: this.imageBucket,
                    Key: file,
                    Body: res.body,
                    ContentLength: res.headers.get("content-length"),
                    ContentType: res.headers.get("content-type"),
                }).promise();
            }
            await this.metadataManager.saveMovieMetadata(movieName, metadata);
        }
    }
}

module.exports = MetadataFetcher;