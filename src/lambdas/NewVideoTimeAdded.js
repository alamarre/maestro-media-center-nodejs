const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const S3Db = require("../impl/aws/S3Db");
const db = new S3Db(s3, process.env.DB_BUCKET);

exports.handler = async (event, context, callback) => {
	await Promise.all(event.Records.map(async record => {
		if(record.dynamodb && record.dynamodb.Keys.partition.S === "video_sources") {
            const sortKey = record.dynamodb.Keys.sort.S;
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
                }
            } 
        }
	}));
    callback(null, `Successfully processed ${event.Records.length} records.`);
};