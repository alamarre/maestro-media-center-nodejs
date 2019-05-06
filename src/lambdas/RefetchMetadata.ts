import AWS = require("aws-sdk");

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const SNS_TOPIC = process.env.SNS_TOPIC || "arn:aws:sns:us-east-1:990455710365:fetch-metadata";

exports.handler = async () => {
    const queryParams = {
        TableName: DYNAMO_TABLE,
        KeyConditionExpression: "#partition = :partition and begins_with(#sort, :sort)",
        ExpressionAttributeNames: {
            "#partition": "partition",
            "#sort": "sort",
        },
        ExpressionAttributeValues: {
            ":partition": "metadata",
            ":sort": "tv/episode/",
        },
    };
    let result = await dynamoClient.query(queryParams).promise();
    let done = false;
    while(!done) {
        for(const item of result.Items) {
            const sortKey = item.sort;
            //console.log("adding", sortKey);
            //sortKeys.push(sortKey);
            if(item.source === "not found") {
                await dynamoClient.delete({
                    Key: {
                        "partition":"metadata", 
                        "sort": item.sort, 
                    },
                    TableName: DYNAMO_TABLE,
                }).promise();
                const name = sortKey.substring("tv/episode/".length);
                const body = {
                    "account": process.env.MAIN_ACCOUNT,
                    "table": "video_sources",
                    "key": "TV Shows/"+name,
                };
                console.log("working on ", name);
                await sns.publish({
                    TopicArn: SNS_TOPIC,
                    Message: JSON.stringify(body),
                }).promise();
            }
        }
        
        if(result.LastEvaluatedKey) {
            queryParams["ExclusiveStartKey"] = result.LastEvaluatedKey;
            result = await dynamoClient.query(queryParams).promise();
        } else {
            done = true;
        }
    }
};

if (process.env.RUN_LOCAL) {
    exports.handler().catch(e => {
        console.error(e);
        process.exit(1);
    });
}