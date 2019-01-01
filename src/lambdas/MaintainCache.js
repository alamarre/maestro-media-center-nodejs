//const cacheRebuilder = require("../impl/aws/CacheRebuilder");

const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const S3CacheManager = require("../impl/aws/S3CacheManager");
const S3Db = require("../impl/aws/S3Db");
const db = new S3Db(s3, process.env.DB_BUCKET);
const s3CacheManager = new S3CacheManager({s3, bucket: process.env.BUCKET, db,});

exports.handler = async (event, context, callback) => {
	await Promise.all(event.Records.map(async record => {
		if(record.dynamodb && record.dynamodb.Keys.partition.S === "video_sources") {
            const sortKey = record.dynamodb.Keys.sort.S;
            if(record.eventName === "INSERT" || record.eventName === "MODIFY") {
                console.log("adding", sortKey);
                const parts = sortKey.split("/");
                const type = parts.shift();
                if(type === "Movies") {
                    await s3CacheManager.addMovieToCache(parts[0]);
                } else if(type === "TV Shows") {
                    const [show, season, episode,] = parts;
                    await s3CacheManager.addEpisodeToCache(show, season, episode);
                }
                
                //await db.addToStringSet([sortKey,], column, "videos", "all_listed");
                // await cacheRebuilder();
            } else if(record.eventName === "REMOVE") {
                console.log("removing", sortKey);
                //await db.removeStringFromSet([sortKey,], column, "videos", "all_listed");
                //await cacheRebuilder();
            } else {
                console.log("no action", record.eventName);
            }
        }
	}));
    callback(null, `Successfully processed ${event.Records.length} records.`);
};