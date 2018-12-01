const http = require("http");

const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");
 
const app = new Koa();
app.use(bodyParser());
const AWS = require("aws-sdk");

const S3Db = require("./impl/aws/S3DB");
let port = 3000;
const portString = process.env.PORT;
if (portString) {
    port = parseInt(portString);
}

const cors = require("@koa/cors");
const defaultRouter = new Router();
app.use(cors());

const db = new S3Db(new AWS.S3(), process.env.DB_BUCKET);

const SimplePasswordAuth = require("./impl/local/SimplePasswordAuth");
const LocalLogin = require("./apis/LocalLogin");
const loginRouter = Router("/api/v1.0/login");
const loginApi = new LocalLogin(db, new SimplePasswordAuth(db), loginRouter);
app.use(async (ctx, next) => { 
    await loginApi.validateAuth(ctx, next);
});

const healthApi = require("./apis/Health");
defaultRouter.get("/health", healthApi);

const IpsApi = require("./apis/Ips");
defaultRouter.get("/api/v1.0/server/ips", IpsApi);

app.use(defaultRouter.routes());
app.use(defaultRouter.allowedMethods());

const DbVideoMapper = require("./impl/aws/DbVideoMapper");
const videoMapper = new DbVideoMapper(db);

const filesRouter = new Router({prefix: "/api/v1.0/folders",});
const FilesApi = require("./apis/Files");
new FilesApi(videoMapper, db, filesRouter);
app.use(filesRouter.routes());
app.use(filesRouter.allowedMethods());

const profileRouter = new Router({prefix: "/api/v1.0/profiles",});
const ProfilesApi = require("./apis/Profiles");
new ProfilesApi(db, profileRouter);
app.use(profileRouter.routes());
app.use(profileRouter.allowedMethods());

const playlistRouter = new Router({prefix: "/api/v1.0/playlists",});
const PlaylistApi = require("./apis/Playlists");
new PlaylistApi(db, playlistRouter);
app.use(playlistRouter.routes());
app.use(playlistRouter.allowedMethods());

const tvRouter = new Router({prefix: "/api/v1.0/shows",});
const TvShowsApi = require("./apis/TvShows");
new TvShowsApi(db, tvRouter);
app.use(tvRouter.routes());
app.use(tvRouter.allowedMethods());

const collectionsRouter = new Router({prefix: "/api/v1.0/collections",});
const CollectionsApi = require("./apis/Collections");
new CollectionsApi(db, collectionsRouter);
app.use(collectionsRouter.routes());
app.use(collectionsRouter.allowedMethods());

const MetaDataManager = require("./metadata/MetadataManager");
const BackgroundMetadataFetcher = require("./metadata/BackgroundMetadataFetcher");
const metaDataManager = new MetaDataManager(db);

const metadataRouter = new Router({prefix: "/metadata",});
const MetadataApi = require("./apis/Metadata");
new MetadataApi(metadataRouter, metaDataManager);
app.use(metadataRouter.routes());
app.use(metadataRouter.allowedMethods());

if(process.env.RUN_LOCAL) {
    const server = http.createServer(app.callback());
    server.listen(port, function listening() {
        console.log("Listening on %d", server.address().port);
    });
}
else {
    const serverless = require("serverless-http");
    module.exports.handler = serverless(app);
}