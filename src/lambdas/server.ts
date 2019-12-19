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

const S3Db = require("../impl/aws/S3Db");
let port = 3000;
const portString = process.env.PORT;
if (portString) {
  port = parseInt(portString);
}

const cors = require("@koa/cors");
const defaultRouter = new Router();
app.use(cors());

const UserSpecificDb = require("../impl/aws/UserSpecificDb");
const s3 = new AWS.S3();
//const globalS3Db = new S3Db(s3, process.env.DB_BUCKET);

import dbFactory from "../database/DbFactory";
import { fail } from "assert";
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


const healthApi = require("../apis/Health");
defaultRouter.get("/health", healthApi);

const IpsApi = require("../apis/Ips");
defaultRouter.get("/api/v1.0/server/ips", IpsApi);

app.use(defaultRouter.routes());
app.use(defaultRouter.allowedMethods());

const CacheToDynamo = require("../impl/aws/CacheToDynamo");
const cacheToDynamo = new CacheToDynamo(dynamoDb);

const DbVideoMapper = require("../impl/aws/DbVideoMapper");
const videoMapper = new DbVideoMapper(s3db, dynamoDb);

const accountRouter = new Router({ prefix: "/api/v1.0/account", });
const AccountApi = require("../apis/Account");
new AccountApi(accountRouter);
app.use(accountRouter.routes());
app.use(accountRouter.allowedMethods());

import CategoryRestriction from "../parentalcontrol/CategoryRestriction";
const categoryDb = s3db;
const categoryRestriction = new CategoryRestriction(db, categoryDb);

const filesRouter = new Router({ prefix: "/api/v1.0/folders", });
const FilesApi = require("../apis/Files");
new FilesApi(videoMapper, db, filesRouter, categoryRestriction);
app.use(filesRouter.routes());
app.use(filesRouter.allowedMethods());

const profileRouter = new Router({ prefix: "/api/v1.0/profiles", });
const ProfilesApi = require("../apis/Profiles");
new ProfilesApi(db, profileRouter);
app.use(profileRouter.routes());
app.use(profileRouter.allowedMethods());

const playlistRouter = new Router({ prefix: "/api/v1.0/playlists", });
const PlaylistApi = require("../apis/Playlists");
new PlaylistApi(db, playlistRouter);
app.use(playlistRouter.routes());
app.use(playlistRouter.allowedMethods());

const tvRouter = new Router({ prefix: "/api/v1.0/shows", });
const TvShowsApi = require("../apis/TvShows");
new TvShowsApi(db, tvRouter);
app.use(tvRouter.routes());
app.use(tvRouter.allowedMethods());

const collectionsRouter = new Router({ prefix: "/api/v1.0/collections", });
const CollectionsApi = require("../apis/Collections");
new CollectionsApi(db, collectionsRouter);
app.use(collectionsRouter.routes());
app.use(collectionsRouter.allowedMethods());

const homepageCollectionsRouter = new Router({ prefix: "/api/v1.0/homepage_collections", });
const HomepageCollectionsApi = require("../apis/HomepageCollections");
new HomepageCollectionsApi(db, homepageCollectionsRouter);
app.use(homepageCollectionsRouter.routes());
app.use(homepageCollectionsRouter.allowedMethods());

const videosRouter = new Router({ prefix: "/api/v1.0/videos", });
const VideosApi = require("../apis/Videos");
new VideosApi(videosRouter, cacheToDynamo, db);
app.use(videosRouter.routes());
app.use(videosRouter.allowedMethods());

const MetaDataManager = require("../metadata/MetadataManager");
const metaDataManager = new MetaDataManager(db);

const serversRouter = new Router({ prefix: "/api/v1.0/servers", });
const ServersApi = require("../apis/Servers");
new ServersApi(db, serversRouter);
app.use(serversRouter.routes());
app.use(serversRouter.allowedMethods());

const metadataRouter = new Router({ prefix: "/api/v1.0/metadata", });
const MetadataApi = require("../apis/Metadata");
new MetadataApi(metadataRouter, metaDataManager);
app.use(metadataRouter.routes());
app.use(metadataRouter.allowedMethods());

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
