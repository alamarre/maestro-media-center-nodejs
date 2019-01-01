const AWS = require("aws-sdk");

const globalPrefixes = ["user_logins", "credentials",];
const skipPrefixes = ["video",];

//const userPrefix = "9ec8353a-19d8-40b0-ac06-84f3e29cfe88"; 

const DynamoDb = require("../impl/aws/DynamoDb");

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();

const dynamoDb = new DynamoDb(dynamoClient, DYNAMO_TABLE);

const globalDynamo = new DynamoDb(dynamoClient, DYNAMO_TABLE);

const s3 = new AWS.S3();
async function run() {
    const params = {
        Bucket: "db.videos.omny.ca",
        Prefix: "metadata/",
    }; 
    let result = await s3.listObjectsV2(params).promise();

    while(result && result.Contents.length > 0) {
        for(const info of result.Contents) {
            const key = info.Key;
            const prefix = key.substring(0, key.indexOf("/"));
            if(skipPrefixes.includes(prefix)
            || !key.endsWith(".json")) {
                continue;
            }

            const data = await s3.getObject({
                Bucket: "db.videos.omny.ca",
                Key: key,
            }).promise();
            let body = JSON.parse(data.Body.toString());
            if(prefix === "credentials") {
                body = {hashPass: body,};
            } else if (prefix === "user_logins") {
                body = {username: body,};
            }
            console.log(key, prefix);
            const dynamoKey = key.substring(0, key.lastIndexOf(".json")).split("/");
            if(globalPrefixes.includes(prefix)) {
                globalDynamo.set.apply(globalDynamo, [body,].concat(dynamoKey));
            } else {
                dynamoDb.set.apply(dynamoDb, [body,].concat(dynamoKey));
            }
        }
        params.StartAfter = result.Contents[result.Contents.length -1].Key;
        result = await s3.listObjectsV2(params).promise();
    }
}

run();

