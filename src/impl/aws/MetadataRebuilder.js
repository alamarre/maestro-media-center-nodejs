const AWS = require("aws-sdk");

//const DynamoDb = require("../impl/aws/DynamoDb");
//const db = new DynamoDb(dynamoClient, DYNAMO_TABLE);
const s3 = new AWS.S3();
const S3Db = require("./S3Db");
const db = new S3Db(s3, process.env.DB_BUCKET);

const MetadataManager = require("../../metadata/MetadataManager");
const metadataManager = new MetadataManager(db);
const IMAGE_BUCKET = process.env.IMAGE_BUCKET;
const S3MetadataFetcher = require("../../metadata/S3MetadataFetcher");
const Tmdb = require("../../metadata/TheMovieDb");
const tmdb = new Tmdb(db);
const metadataFetcher = new S3MetadataFetcher(s3, IMAGE_BUCKET, metadataManager, tmdb);

module.exports = async () => {
    const cache = await db.get("video", "cache");
    const tvShows = cache.folders["TV Shows"].folders;
    for(const show of Object.keys(tvShows)) {
        if(show <= "Sample") {
            continue;
        }
        const seasons = tvShows[show].folders;
        for(const season of Object.keys(seasons)) {
            for(const episode of Object.keys(seasons[season].files)) {
                //console.log(show, season, episode);
                try {
                    await metadataFetcher.addTvShow(show, season, episode);
                } catch(e) {
                    console.log("failed",show, season, episode);
                    console.error(e);
                }
            }
        }
    }
       /* count += result.Items.length;
        for(const item of result.Items) {
            const sortKey = item.sort;
            const parts = sortKey.split("/");
                if(parts[0] === "Movies") {
                    const movieName = parts[1];
                    await metadataFetcher.addMovie(movieName);
                } else if (parts[0] === "TV Shows") {
                    const [,showName, season, episode,] = parts;
                    await metadataFetcher.addTvShow(showName, season, episode);
                }
        }
        
        if(result.LastEvaluatedKey) {
            queryParams.ExclusiveStartKey = result.LastEvaluatedKey;
            result = await dynamoClient.query(queryParams).promise();
        } else {
            done = true;
        }*/
    //}
};