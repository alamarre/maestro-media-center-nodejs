import AWS = require("aws-sdk");
/*
const s3 = new AWS.S3();
const S3Db = require("../impl/aws/S3Db");
const db = new S3Db(s3, process.env.DB_BUCKET);
*/

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const DynamoDb = require("../impl/aws/DynamoDb");
const db = new DynamoDb(dynamoClient, DYNAMO_TABLE);

const normalize = require("./utilities/EventNormalizer");

exports.handler = async (event, context, callback) => {
	await Promise.all(normalize(event).map(async record => {
		if(record.table === "video_sources") {
            const sortKey = record.key;
            console.log(record.eventName, sortKey);
            if(record.eventName === "INSERT") {
                console.log("adding", sortKey);
                const parts = sortKey.split("/");
                const type = parts.shift();
                if(type === "Movies") {
                    const movie = parts[0];
                    console.log("adding movie data", movie);
                    const time = new Date().getTime();
                    await db.set({time, movie,} ,"movie_added", `${time}`, movie);
                } else if (type === "TV Shows") {
                    const show = parts[0];
                    const season = parts[1];
                    const episode = parts[2];
                    console.log("updating show episode data", show, season, episode);
                    const time = new Date().getTime();
                    await db.set({time, show, season, episode} ,"latest_show_episode_added", show);
                }
            }
        }
	}));
    callback(null, `Successfully processed ${event.Records.length} records.`);
};
