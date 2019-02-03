const AWS = require("aws-sdk");

const MetadataManager = require("../metadata/MetadataManager");
const s3 = new AWS.S3();

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const DynamoDb = require("../impl/aws/DynamoDb");
const db = new DynamoDb(dynamoClient, DYNAMO_TABLE);

const metadataManager = new MetadataManager(db);
const IMAGE_BUCKET = process.env.IMAGE_BUCKET;
const S3MetadataFetcher = require("../metadata/S3MetadataFetcher");
const Tmdb = require("../metadata/TheMovieDb");
const tmdb = new Tmdb(db);
const metadataFetcher = new S3MetadataFetcher(s3, IMAGE_BUCKET, metadataManager, tmdb);

exports.handler = async (event, context, callback) => {
    await Promise.all(event.Records.map(async record => {
        if (record.dynamodb && record.dynamodb.Keys.partition.S === "video_sources") {
            const sortKey = record.dynamodb.Keys.sort.S;
            console.log(sortKey);
            if (record.eventName === "INSERT" || record.eventName === "MODIFY") {
                console.log("adding");
                const parts = sortKey.split("/");
                if (parts[0] === "Movies") {
                    const movieName = parts[1];
                    await metadataFetcher.addMovie(movieName);
                } else if (parts[0] === "TV Shows") {
                    const [, showName, season, episode,] = parts;
                    await metadataFetcher.addTvShow(showName, season, episode);
                }
            }
        }
    }));
    callback(null, `Successfully processed ${event.Records.length} records.`);
};