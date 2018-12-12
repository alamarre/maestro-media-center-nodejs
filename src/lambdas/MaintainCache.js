const cacheRebuilder = require("../impl/aws/CacheRebuilder");

exports.handler = async (event, context, callback) => {
	await Promise.all(event.Records.map(async record => {
		if(record.dynamodb && record.dynamodb.Keys.partition.S === "video_sources") {
            const sortKey = record.dynamodb.Keys.sort.S;
            if(record.eventName === "INSERT" || record.eventName === "MODIFY") {
                console.log("adding", sortKey);
                //await db.addToStringSet([sortKey,], column, "videos", "all_listed");
                cacheRebuilder();
            } else if(record.eventName === "REMOVE") {
                console.log("removing", sortKey);
                //await db.removeStringFromSet([sortKey,], column, "videos", "all_listed");
                cacheRebuilder();
            } else {
                console.log("no action", record.eventName);
            }
        }
	}));
    callback(null, `Successfully processed ${event.Records.length} records.`);
};