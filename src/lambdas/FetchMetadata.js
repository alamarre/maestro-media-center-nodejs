const AWS = require("aws-sdk");

const MetadataManager = require("../metadata/MetadataManager");
const s3 = new AWS.S3();
const sns = new AWS.SNS();

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const DynamoDb = require("../impl/aws/DynamoDb");
const db = new DynamoDb(dynamoClient, DYNAMO_TABLE);

const metadataManager = new MetadataManager(db);
const IMAGE_BUCKET = process.env.IMAGE_BUCKET;
const S3MetadataFetcher = require("../metadata/S3MetadataFetcher");
const Tmdb = require("../metadata/TheMovieDb");
const tmdb = new Tmdb(db);
const metadataFetcher = new S3MetadataFetcher(s3, sns, IMAGE_BUCKET, metadataManager, tmdb);

const normalize = require("./utilities/EventNormalizer");

exports.handler = async (event, context, callback) => {
    await Promise.all(normalize(event).map(async record => {
        console.log(JSON.stringify(record));
        if (record.table === "video_sources") {
            const sortKey = record.key;
            console.log("fetching metadata for", sortKey);
            const parts = sortKey.split("/");
            if (parts[0] === "Movies") {
                const movieName = parts[1];
                await metadataFetcher.addMovie(record.account, movieName);
            } else if (parts[0] === "TV Shows") {
                const [, showName, season, episode,] = parts;
                await metadataFetcher.addTvShow(record.account, showName, season, episode);
            }
        
        }
    }));
    callback(null, `Successfully processed ${event.Records.length} records.`);
};

if (process.env.RUN_LOCAL) {
    exports.handler({ Records: [{
        account: process.env.MAIN_ACCOUNT,
        table: "video_sources",
        key: process.env.KEY,
    },],
    }).catch(e => {
        console.error(e);
        process.exit(1);
    });
}