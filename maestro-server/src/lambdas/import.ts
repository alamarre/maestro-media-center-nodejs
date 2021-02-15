

const SERVER = process.env.SERVER;
const BASE_VIDEO_URL = `${SERVER}/videos/`;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const fetch = require("node-fetch");
import AWS = require("aws-sdk");

const dynamoClient = new AWS.DynamoDB.DocumentClient();
const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";

const CacheToDynamo = require("../impl/aws/CacheToDynamo");
const DynamoDb = require("../impl/aws/DynamoDb");
const db = new DynamoDb(dynamoClient, DYNAMO_TABLE);


const s3 = new AWS.S3();
//const S3CacheManager = require("../impl/aws/S3CacheManager");
//const CacheToS3 = require("../impl/aws/CacheToS3");
const S3Db = require("../impl/aws/S3Db");
const s3Db = new S3Db(s3, process.env.DB_BUCKET);
/*const cacheToS3 = new CacheToS3(s3Db, process.env.BUCKET);
const s3CacheManager = new S3CacheManager({s3, bucket: process.env.BUCKET, s3Db,});*/

async function run() {
    const queryString = `?access_token=${ACCESS_TOKEN}`;

    const cacheResponse = await fetch(`${SERVER}/api/v1.0/folders/cache${queryString}`);
    const cache = await cacheResponse.json();

    const rootFoldersResponse = await fetch(`${SERVER}/api/v1.0/folders/root${queryString}`);
    const rootFolders = await rootFoldersResponse.json();
    const currentCache = await s3Db.get("video", "cache");
    const cacheToDynamo = new CacheToDynamo(db, currentCache);
    await cacheToDynamo.addCache(cache, rootFolders, BASE_VIDEO_URL);
    //await cacheToS3.addCache(cache, rootFolders, BASE_VIDEO_URL);

    //await s3CacheManager.buildAndStoreCache();

    return "complete";
}

module.exports.handler = run;
if(process.env.RUN_LOCAL) {
    run().catch(e => {
        console.error(e);
        process.exit(1);
    });
}