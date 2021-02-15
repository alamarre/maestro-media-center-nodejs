import AWS = require("aws-sdk");
import IDatabase from "./IDatabase";

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
import DynamoDb from "./impl/DynamoDb";
let globalDatabase = null;

export default (prefix: string = null) : IDatabase => {
    if(prefix) {
        return new DynamoDb(dynamoClient, DYNAMO_TABLE, prefix);
    }
    if(globalDatabase === null) {
        globalDatabase = new DynamoDb(dynamoClient, DYNAMO_TABLE, null);
    }
    return globalDatabase;
}