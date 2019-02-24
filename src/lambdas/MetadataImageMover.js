const AWS = require("aws-sdk");

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const SOURCE_BUCKET = process.env.SOURCE_BUCKET;
const DESTINATION_BUCKET = process.env.DESTINATION_BUCKET;

exports.handler = async () => {
    const queryParams = {
        TableName: DYNAMO_TABLE,
        KeyConditionExpression: "#partition = :partition",
        ExpressionAttributeNames: {
            "#partition": "partition",
        },
        ExpressionAttributeValues: {
            ":partition": "metadata",
        },
    };
    let result = await dynamoClient.query(queryParams).promise();
    let done = false;
    let count = 0;
    while (!done) {
        count += result.Items.length;
        for (const item of result.Items) {
            const sortKey = item.sort;
            //console.log("adding", sortKey);
            //sortKeys.push(sortKey);
            const source = item.source;
            if (source === "not found" || !item.poster) {
                continue;
            }
            const sortParts = sortKey.split("/");
            const sourceType = sortParts.shift();

            let key = sortKey + ".jpg";
            let destinationKey = source.toLowerCase() + "/" + item.id + "/poster.jpg";


            if (sourceType === "movie") {
                key = sortKey.replace("movie", "movies") + ".jpg";
                destinationKey = source.toLowerCase() + "/movie/" + item.id + "/poster.jpg";
            } else if (sourceType === "tv") {
                const subType = sortParts.shift();
                if (subType === "episode") {
                    destinationKey = source.toLowerCase() + "/tv/episode/" + item.id + "/poster.jpg";
                } else if (subType === "show") {
                    destinationKey = source.toLowerCase() + "/tv/show/" + item.id + "/poster.jpg";
                }
            }

            try {
                await s3.headObject({
                    Bucket: DESTINATION_BUCKET,
                    Key: destinationKey,
                }).promise();
                continue;
            } catch (e) {
                // skip
            }

            try {
                const data = await s3.getObject({
                    Bucket: SOURCE_BUCKET,
                    Key: key,
                }).promise();

                await s3.putObject({
                    Bucket: DESTINATION_BUCKET,
                    Key: destinationKey,
                    Body: data.Body,
                }).promise();
            } catch (e) {
                console.error(e, key, destinationKey);
            }

        }

        if (result.LastEvaluatedKey) {
            queryParams.ExclusiveStartKey = result.LastEvaluatedKey;
            result = await dynamoClient.query(queryParams).promise();
        } else {
            done = true;
        }
    }

    console.log("items moved", count);
};

if (process.env.RUN_LOCAL) {
    exports.handler().catch(e => {
        console.error(e);
        process.exit(1);
    });
}