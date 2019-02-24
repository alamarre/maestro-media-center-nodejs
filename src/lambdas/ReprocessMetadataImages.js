const AWS = require("aws-sdk");

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const fetch = require("node-fetch");

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
            ":sort": "tv/show/",
        },
    };
    let result = await dynamoClient.query(queryParams).promise();
    let done = false;
    while(!done) {
        for(const item of result.Items) {
            const sortKey = item.sort;
            //console.log("adding", sortKey);
            //sortKeys.push(sortKey);
            if(item.source !== "not found") {
                const name = sortKey.substring("tv/show/".length);
                const {source, id, poster, overview,} = item;

                const query = `?access_token=${process.env.ACCESS_TOKEN}`;
                console.log("working on ", name);
                await fetch("https://adminapi.maestromediacenter.com/api/v1.0/metadata/tv/show/"+name+query, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({source, id, poster, overview,}),
                });
            }
        }
        
        if(result.LastEvaluatedKey) {
            queryParams.ExclusiveStartKey = result.LastEvaluatedKey;
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