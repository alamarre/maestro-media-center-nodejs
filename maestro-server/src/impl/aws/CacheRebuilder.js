const AWS = require("aws-sdk");

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
//const DynamoDb = require("../impl/aws/DynamoDb");
//const db = new DynamoDb(dynamoClient, DYNAMO_TABLE);
const s3 = new AWS.S3();
const S3Db = require("./S3Db");
const db = new S3Db(s3, process.env.DB_BUCKET);


function addToCache(cache, parts) {
    let current = cache;
    for(const index in parts) {
        const part = parts[index];
        if(index == parts.length -1) {
            current.files[part] = "";
        } else {
            if(!current.folders[part]) {
                current.folders[part] = {files:{}, folders:{},};
            }
            current = current.folders[part];
        }
    }
}

module.exports = async () => {
    const queryParams = {
        TableName: DYNAMO_TABLE,
        KeyConditionExpression: "#partition = :partition",
        ExpressionAttributeNames: {
            "#partition": "partition",
        },
        ExpressionAttributeValues: {
            ":partition": "video_sources",
        },
    };
    let result = await dynamoClient.query(queryParams).promise();
    let done = false;
    const cache = {files:{}, folders:{},};
    let count =0;
    while(!done) {
        count += result.Items.length;
        for(const item of result.Items) {
            const sortKey = item.sort;
            //console.log("adding", sortKey);
            //sortKeys.push(sortKey);
            addToCache(cache, sortKey.split("/"));
        }
        
        if(result.LastEvaluatedKey) {
            queryParams.ExclusiveStartKey = result.LastEvaluatedKey;
            result = await dynamoClient.query(queryParams).promise();
        } else {
            done = true;
        }
    }

    console.log("cached items", count);
    await db.set(cache, "video", "cache");
};