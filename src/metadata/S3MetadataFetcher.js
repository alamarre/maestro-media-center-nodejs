const fetch = require("node-fetch");
const RESIZE_SNS_TOPIC = process.env.RESIZE_SNS_TOPIC;

class MetadataFetcher {
    constructor(s3, sns, imageBucket, metadataManager, metadataFetcher) {
        this.s3 = s3;
        this.sns = sns;
        this.imageBucket = imageBucket;
        this.metadataManager = metadataManager;
        this.metadataFetcher = metadataFetcher;
    }

    async addTvEpisodeMetadata(accountId, showName, season, episode, episodeMetadata) {
        if(episodeMetadata.poster) {
            console.log("fetching poster", episodeMetadata.poster);
            const res = await fetch(episodeMetadata.poster);
            const file = `tmdb/tv/episode/${episodeMetadata.id}/poster.jpg`;
            await this.s3.putObject({
                Bucket: this.imageBucket,
                Key: file,
                Body: res.body,
                ContentLength: res.headers.get("content-length"),
                ContentType: res.headers.get("content-type"),
            }).promise();

            const width = 227;
            const height = 127;
            const destinationImage = `${accountId}/${width}x${height}/tv/episode/${showName}/${season}/${episode}.png`;
            const sourceImage = file;
            const body = JSON.stringify({width, height, sourceImage, destinationImage,});

            await this.sns.publish({
                TopicArn: RESIZE_SNS_TOPIC,
                Message: body,
            }).promise();
        }
        await this.metadataManager.saveTvEpisodeMetadata(showName, season, episode, episodeMetadata);
    }
    

    async addTvShowMetadata(accountId, showName, metadata) {
            if(metadata.poster) {
                console.log("fetching poster", metadata.poster);
                const res = await fetch(metadata.poster);
                const file = `tmdb/tv/show/${metadata.id}/poster.jpg`;
                await this.s3.putObject({
                    Bucket: this.imageBucket,
                    Key: file,
                    Body: res.body,
                    ContentLength: res.headers.get("content-length"),
                    ContentType: res.headers.get("content-type"),
                }).promise();

                const sourceImage = file;
                let width = 150;
                let height = 225;
                let destinationImage = `${accountId}/${width}x${height}/tv/show/${showName}.png`;

                const body1 = JSON.stringify({width, height, sourceImage, destinationImage,});

                await this.sns.publish({
                    TopicArn: RESIZE_SNS_TOPIC,
                    Message: body1,
                }).promise();

                width = 50;
                height = 75;
                destinationImage = `${accountId}/${width}x${height}/tv/show/${showName}.png`;
                const body2 = JSON.stringify({width, height, sourceImage, destinationImage,});
                

                await this.sns.publish({
                    TopicArn: RESIZE_SNS_TOPIC,
                    Message: body2,
                }).promise();
            }
            await this.metadataManager.saveTvShowMetadata(showName, metadata);
            return metadata;
    }

    async addTvShow(accountId, showName, season, episode) {
        let data = await this.metadataManager.getTvShowMetadata(showName);
        if(!data) {
            const metadata = await this.metadataFetcher.searchForTvShow(showName);
            data = await this.addTvShowMetadata(accountId, showName, metadata);
        }

        if(data && data.id && episode) {
            const episodeData = await this.metadataManager.getTvEpisodeMetadata(showName, season, episode);
            if(!episodeData) {
                const episodeMetadata = await this.metadataFetcher.getEpisodeInfo(data, season, episode);
                
                this.addTvEpisodeMetadata(accountId, showName, season, episode, episodeMetadata);
            }
        }
    }

    async addMovie(accountId, movieName) {
        const data = await this.metadataManager.getMovieMetadata(movieName);
        if(!data) {
            console.log(`fetching metadata for ${movieName}`);
            const metadata = await this.metadataFetcher.searchForMovie(movieName);
            await this.addMovieMetadata(accountId, movieName, metadata);
        } else {
            console.log(`already have metadata for ${movieName} ${JSON.stringify(data)}`);
        }
    }

    async addMovieMetadata(accountId, movieName, metadata) {
        if(metadata.poster) {
            console.log("fetching poster", metadata.poster);
            const res = await fetch(metadata.poster);
            const file = `tmdb/movie/${metadata.id}/poster.jpg`;
            await this.s3.putObject({
                Bucket: this.imageBucket,
                Key: file,
                Body: res.body,
                ContentLength: res.headers.get("content-length"),
                ContentType: res.headers.get("content-type"),
            }).promise();

            let width = 150;
            let height = 225;
            let destinationImage = `${accountId}/${width}x${height}/movies/${movieName}.png`;
            const sourceImage = file;
            const body1 = JSON.stringify({width, height, sourceImage, destinationImage,});

            await this.sns.publish({
                TopicArn: RESIZE_SNS_TOPIC,
                Message: body1,
            }).promise();

            width = 50;
            height = 75;
            destinationImage = `${accountId}/${width}x${height}/movies/${movieName}.png`;
            const body2 = JSON.stringify({width, height, sourceImage, destinationImage,});
            
            await this.sns.publish({
                TopicArn: RESIZE_SNS_TOPIC,
                Message: body2,
            }).promise();
        }

        if(metadata.collectionInfo && metadata.collectionInfo.poster) {
            console.log("fetching poster", metadata.collectionInfo.poster);
            const res = await fetch(metadata.collectionInfo.poster);
            const file = `tmdb/collections/${metadata.collectionInfo.collectionName}.jpg`;
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

module.exports = MetadataFetcher;