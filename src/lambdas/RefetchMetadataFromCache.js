const AWS = require("aws-sdk");

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const s3 = new AWS.S3();
const SNS_TOPIC = process.env.SNS_TOPIC || "arn:aws:sns:us-east-1:990455710365:fetch-metadata";

exports.handler = async () => {
    const params = {
        Bucket: "db.videos.omny.ca",
        Key: "video/cache.json",
    };
    const result = await s3.getObject(params).promise();
    const cache = JSON.parse(result.Body);
    const tvFolders = cache.folders["TV Shows"].folders;
    for(const show of Object.keys(tvFolders)) {
        const showFolders = tvFolders[show].folders;
        for(const season of Object.keys(showFolders)) {
            const seasonFiles = showFolders[season].files;
            for(const episode of Object.keys(seasonFiles)) {
                const name = `${show}/${season}/${episode}`;
                await dynamoClient.delete({
                    Key: {
                        "partition":"metadata", 
                        "sort": "tv/episode/"+name, 
                    },
                    TableName: DYNAMO_TABLE,
                }).promise();
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
    }
    
};

if (process.env.RUN_LOCAL) {
    exports.handler().catch(e => {
        console.error(e);
        process.exit(1);
    });
}