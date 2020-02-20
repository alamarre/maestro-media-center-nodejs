const http = require("http");
const als = require("async-local-storage");
als.enable();
export { };

const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");

const app = new Koa();
app.use(bodyParser());
const AWS = require("aws-sdk");

const s3 = new AWS.S3();
const sns = new AWS.SNS();


const MetadataManager = require("./metadata/MetadataManager");

let port = 3000;
const portString = process.env.PORT;
if (portString) {
  port = parseInt(portString);
}

const cors = require("@koa/cors");
const defaultRouter = new Router();
app.use(cors());

const { loggingMiddleware, errorHandler, } = require("./impl/logger");
app.use(loggingMiddleware("Maestro Media Center"));
app.on("error", errorHandler);

const UserSpecificDb = require("./impl/aws/UserSpecificDb");
const DynamoDb = require("./impl/aws/DynamoDb");
const dynamoDb = new UserSpecificDb("db");

const DYNAMO_TABLE = process.env.DYNAMO_TABLE || "maestro-media-center";
const dynamoClient = new AWS.DynamoDB.DocumentClient();
const db = dynamoDb;

const authDB = new DynamoDb(dynamoClient, DYNAMO_TABLE, "admin_auth");

const healthApi = require("./apis/Health");
defaultRouter.get("/health", healthApi);

app.use(defaultRouter.routes());
app.use(defaultRouter.allowedMethods());

const SimplePasswordAuth = require("./impl/local/SimplePasswordAuth");
const LocalLogin = require("./apis/LocalLogin");
const loginRouter = Router({ prefix: "/api/v1.0/login", });
const loginApi = new LocalLogin(authDB, new SimplePasswordAuth(authDB), loginRouter);
app.use(async (ctx, next) => {
  await loginApi.validateAuth(ctx, next);
});
app.use(loginRouter.routes());
app.use(loginRouter.allowedMethods());

app.use(async (ctx, next) => {
  if (ctx.username) {
    als.scope();
    als.set("db", new DynamoDb(dynamoClient, DYNAMO_TABLE, ctx.accountId));

    if (!ctx.accountId) {
      ctx.accountId = process.env.MAIN_ACCOUNT;
    }
    try {
      await next();
    } catch (e) {
      console.error(e.message, e.stack);
    }
  }
});

const metadataManager = new MetadataManager(db);
const IMAGE_BUCKET = process.env.IMAGE_BUCKET;
const S3MetadataFetcher = require("./metadata/S3MetadataFetcher");
const Tmdb = require("./metadata/TheMovieDb");
const tmdb = new Tmdb(db);
const metadataFetcher = new S3MetadataFetcher(s3, sns, IMAGE_BUCKET, metadataManager, tmdb);

const metadataRouter = new Router({ prefix: "/api/v1.0/metadata", });
const MetadataApi = require("./apis/admin/Metadata");
new MetadataApi(metadataRouter, db, metadataFetcher);
app.use(metadataRouter.routes());
app.use(metadataRouter.allowedMethods());

const homepageCollectionRouter = new Router({ prefix: "/api/v1.0/homepage_collections", });
const HomePageCollectionsApi = require("./apis/admin/HomepageCollections");
new HomePageCollectionsApi(homepageCollectionRouter, db);
app.use(homepageCollectionRouter.routes());
app.use(homepageCollectionRouter.allowedMethods());

import B2FileSource from './impl/backblaze/B2FileSource'
const b2FileSource = process.env.BASE_B2_VIDEO_URL ? new B2FileSource(db) : null;

const b2Router = new Router({ prefix: "/api/v1.0/b2", });
import B2Credentials from "./apis/admin/B2Files";
new B2Credentials(b2Router, b2FileSource, db);
app.use(b2Router.routes());
app.use(b2Router.allowedMethods());

const dnsRouter = new Router({ prefix: "/api/v1.0/dns", });
const DnsApi = require("./apis/admin/Dns");
new DnsApi(dnsRouter, db);
app.use(dnsRouter.routes());
app.use(dnsRouter.allowedMethods());

if (process.env.RUN_LOCAL) {
  const server = http.createServer(app.callback());
  server.listen(port, function listening() {
    console.log("Listening on %d", server.address().port);
  });
}
else {
  const serverless = require("serverless-http");
  module.exports.handler = serverless(app);
}

