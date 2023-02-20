require('source-map-support').install();

const http = require("http");
const als = require("async-local-storage");
als.enable();

const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");

const app = new Koa();
app.use(bodyParser());
import AWS = require("aws-sdk");

const { loggingMiddleware, errorHandler, } = require("../impl/logger");
app.use(loggingMiddleware("Maestro Media Center"));
app.on("error", errorHandler);

import IApi from "../apis/IApi";

import S3Db from "../impl/aws/S3Db";
let port = 3000;
const portString = process.env.PORT;
if (portString) {
  port = parseInt(portString);
}

function mapApi(prefix: string, api: IApi) {
  const router = new Router({ prefix });
  api.init(router);
  app.use(router.routes());
  app.use(router.allowedMethods());
}

const cors = require("@koa/cors");
const defaultRouter = new Router();
app.use(cors());

import UserSpecificDb from "../impl/aws/UserSpecificDb";
const s3 = new AWS.S3();
//const globalS3Db = new S3Db(s3, process.env.DB_BUCKET);

import dbFactory from "../database/DbFactory";
const dynamoDb = new UserSpecificDb("db");

const s3db = new UserSpecificDb("s3db");

const db = dynamoDb;
const globalDynamoDb = dbFactory();
const globalDb = globalDynamoDb;

const SimplePasswordAuth = require("../impl/local/SimplePasswordAuth");
const LocalLogin = require("../apis/LocalLogin");
const loginRouter = Router({ prefix: "/api/v1.0/login", });
const loginApi = new LocalLogin(globalDb, new SimplePasswordAuth(globalDb), loginRouter);
app.use(async (ctx, next) => {
  await loginApi.validateAuth(ctx, next);
});
app.use(loginRouter.routes());
app.use(loginRouter.allowedMethods());

app.use(async (ctx, next) => {
  if (ctx.username) {
    als.scope();
    als.set("db", dbFactory(ctx.accountId));
    als.set("s3db", new S3Db(s3, process.env.DB_BUCKET, ctx.accountId));

    if (!ctx.accountId) {
      ctx.accountId = process.env.MAIN_ACCOUNT;
    }
    await next();
  }
});

import healthApi from "../apis/Health";
defaultRouter.get("/health", healthApi);

import IpsApi from "../apis/Ips";
defaultRouter.get("/api/v1.0/server/ips", IpsApi);

app.use(defaultRouter.routes());
app.use(defaultRouter.allowedMethods());

const CacheToDynamo = require("../impl/aws/CacheToDynamo");
const cacheToDynamo = new CacheToDynamo(dynamoDb);

import B2FileSource from '../impl/backblaze/B2FileSource'
const b2FileSource = process.env.BASE_B2_VIDEO_URL ? new B2FileSource(db) : null;

const DbVideoMapper = require("../impl/aws/DbVideoMapper");
const videoMapper = new DbVideoMapper(s3db, dynamoDb, b2FileSource);

import B2FilesApi from "../apis/B2Files";
mapApi("/api/v1.0/b2", new B2FilesApi(b2FileSource, db));

import AccountApi from "../apis/Account";
mapApi("/api/v1.0/account", new AccountApi());

import CategoryRestriction from "../parentalcontrol/CategoryRestriction";

const categoryDb = s3db;
const categoryRestriction = new CategoryRestriction(db, categoryDb);

import FilesApi from "../apis/Files";
mapApi("/api/v1.0/folders", new FilesApi(videoMapper, db, categoryRestriction));

import ProfilesApi from "../apis/Profiles";
mapApi("/api/v1.0/profiles", new ProfilesApi(db));

import PlaylistApi from "../apis/Playlists";
mapApi("/api/v1.0/playlists", new PlaylistApi(db,));

import TvShowsApi from "../apis/TvShows";
mapApi("/api/v1.0/shows", new TvShowsApi(db));

import CollectionsApi from "../apis/Collections";
mapApi("/api/v1.0/collections", new CollectionsApi(db));

import HomepageCollectionsApi from "../apis/HomepageCollections";
mapApi("/api/v1.0/homepage_collections", new HomepageCollectionsApi(db));

import VideosApi from "../apis/Videos";
mapApi("/api/v1.0/videos", new VideosApi(cacheToDynamo, db));

import MetaDataManager from "../metadata/MetadataManager";
const metaDataManager = new MetaDataManager(db);

import ServersApi from "../apis/Servers";
mapApi("/api/v1.0/servers", new ServersApi(db));

import MetadataApi from "../apis/Metadata";
mapApi("/api/v1.0/metadata", new MetadataApi(metaDataManager));

const serverless = require("serverless-http");
module.exports.handler = serverless(app);

declare var Response, addEventListener;
if (process.env.IS_CLOUDFLARE) {
  const callback = app.callback();
  addEventListener('fetch', event => {
    event.respondWith(async () => {
      const request = event.request;
      const response = new http.ServerResponse();
      const koaResponse = await callback(request, response);
      return new Response(koaResponse.body, koaResponse);
    });
  })
}

if (process.env.RUN_LOCAL) {
  const server = http.createServer(app.callback());
  server.listen(port, function listening() {
    console.log("Listening on %d", server.address().port);
  });
}
