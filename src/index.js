const http = require("http");

const Koa = require("koa");
const Router = require("koa-router");
const bodyParser = require("koa-bodyparser");

const app = new Koa();
app.use(bodyParser());

const LocalStorage = require("./impl/local/LocalStorage");
const FileBasedDb = require("./impl/local/FileBasedDb");
let port = 3000;
const portString = process.env.PORT;
if (portString) {
  port = parseInt(portString);
}

const cors = require("@koa/cors");
const defaultRouter = new Router();
app.use(cors());

const db = new FileBasedDb("./db");
const localStorage = new LocalStorage(db);

const SimplePasswordAuth = require("./impl/local/SimplePasswordAuth");
const LocalLogin = require("./apis/LocalLogin");
const loginRouter = Router({ prefix: "/api/v1.0/login", });
const loginApi = new LocalLogin(db, new SimplePasswordAuth(db), loginRouter);
app.use(async (ctx, next) => {
  await loginApi.validateAuth(ctx, next);
});
app.use(loginRouter.routes());
app.use(loginRouter.allowedMethods());

const healthApi = require("./apis/Health");
defaultRouter.get("/health", healthApi);

const IpsApi = require("./apis/Ips");
defaultRouter.get("/api/v1.0/server/ips", IpsApi);

app.use(defaultRouter.routes());
app.use(defaultRouter.allowedMethods());

const VideosMapper = require("./impl/VideosMapper");
const videoMapper = new VideosMapper(db, localStorage, false, true);

const filesRouter = new Router({ prefix: "/api/v1.0/folders", });
const FilesApi = require("./apis/Files");
new FilesApi(videoMapper, db, filesRouter);
app.use(filesRouter.routes());
app.use(filesRouter.allowedMethods());

const profileRouter = new Router({ prefix: "/api/v1.0/profiles", });
const ProfilesApi = require("./apis/Profiles");
new ProfilesApi(db, profileRouter);
app.use(profileRouter.routes());
app.use(profileRouter.allowedMethods());

const videoRouter = new Router({ prefix: "/videos", });
const VideosApi = require("./apis/LocalVideos");
new VideosApi(localStorage, videoRouter);
app.use(videoRouter.routes());
app.use(videoRouter.allowedMethods());

const playlistRouter = new Router({ prefix: "/api/v1.0/playlists", });
const PlaylistApi = require("./apis/Playlists");
new PlaylistApi(db, playlistRouter);
app.use(playlistRouter.routes());
app.use(playlistRouter.allowedMethods());

videoMapper.scanIndexedFolders();

const RemoteUpdater = require("./impl/local/RemoteUpdater");
const remoteUpdater = new RemoteUpdater(videoMapper);
remoteUpdater.listen();

const tvRouter = new Router({ prefix: "/api/v1.0/shows", });
const TvShowsApi = require("./apis/TvShows");
new TvShowsApi(db, tvRouter);
app.use(tvRouter.routes());
app.use(tvRouter.allowedMethods());

const collectionsRouter = new Router({ prefix: "/api/v1.0/collections", });
const CollectionsApi = require("./apis/Collections");
new CollectionsApi(db, collectionsRouter);
app.use(collectionsRouter.routes());
app.use(collectionsRouter.allowedMethods());

const UserQueueManager = require("./impl/local/UserQueueManager");
const userQueueManager = new UserQueueManager();
const remoteRouter = new Router({ prefix: "/api/v1.0/remote", });
const RemoteApi = require("./apis/RemoteControl");
new RemoteApi(db, remoteRouter, userQueueManager);
app.use(remoteRouter.routes());
app.use(remoteRouter.allowedMethods());

const MetaDataManager = require("./metadata/MetadataManager");
const BackgroundMetadataFetcher = require("./metadata/BackgroundMetadataFetcher");
const metaDataManager = new MetaDataManager(db);

const metadataRouter = new Router({ prefix: "/metadata", });
const MetadataApi = require("./apis/Metadata");
new MetadataApi(metadataRouter, metaDataManager);
app.use(metadataRouter.routes());
app.use(metadataRouter.allowedMethods());

const TheMovieDb = require("./metadata/TheMovieDb");
const theMovieDb = new TheMovieDb(db);
if (theMovieDb.canRun()) {
  const backgroundMetadataFetcher = new BackgroundMetadataFetcher(videoMapper, metaDataManager, theMovieDb, db);
  backgroundMetadataFetcher.fetch().catch(e => {
    console.error(e);
  });
}

if (!process.env.SSL_HOSTNAME) {
  const server = http.createServer(app.callback());

  server.listen(port, function listening() {
    console.log("Listening on %d", server.address().port);
  });
}

module.exports = app;
