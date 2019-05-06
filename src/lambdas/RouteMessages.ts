import AWS = require("aws-sdk");
const sns = new AWS.SNS();

const normalize = require("./utilities/EventNormalizer");
const TOPIC_PREFIX = process.env.TOPIC_PREFIX;

exports.handler = async (event, context, callback) => {
    await Promise.all(normalize(event).map(async record => {
        const {table, eventName,} = record;
        const topic = `${TOPIC_PREFIX}${eventName.toLowerCase()}-${table}`;
        console.log("publishing to topic", topic);
        try {
            await sns.publish({
                TopicArn: topic,
                Message: JSON.stringify(record),
            }).promise();
        } catch(e) {
            console.error(e);
        }
    }));
    callback(null, `Successfully processed ${event.Records.length} records.`);
};