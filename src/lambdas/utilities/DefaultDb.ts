import AWS = require("aws-sdk");
import DynamoDb from "../../database/impl/DynamoDb";

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const db = new DynamoDb(dynamoClient, DYNAMO_TABLE);

export default db;
