import IMetadataProvider from '../../metadata/IMetadataProvider';
export default class MetadataApi {
  constructor(
    private router,
    private db,
    private metadataFetcher,
    private metadataProvider: IMetadataProvider) {
    this.router = router;
    this.init();
  }

  async getMissingMetadata(ctx) {
    const { type, subtype, } = ctx.params;
    let result;
    if (type === "movie") {
      result = await this.db.list("possible_metadata", "movie");
    } else if (type === "tv") {
      result = await this.db.list("possible_metadata", "tv", subtype);
    }

    if (!result) {
      return ctx.status = 404;
    }

    result = result.map(r => {
      const parts = r.key.split("/");
      const extra: any = {};
      if (type === "movie") {
        extra.movieName = parts[2];
      } else if (subtype === "show") {
        extra.showName = parts[3];
      } else if (subtype === "episode") {
        extra.showName = parts[3];
        extra.season = parts[4];
        extra.episode = parts[5];
      }

      const res = Object.assign({ type, subtype, }, r, extra);
      delete res.key;
      return res;
    });

    ctx.body = result;
  }

  async addMovieMetadata(ctx) {
    const { movieName, } = ctx.params;
    const accountId = ctx.accountId;
    const metadata = ctx.request.body;
    await this.metadataFetcher.addMovieMetadata(accountId, movieName, metadata);
    ctx.status = 204;
  }

  async getPossibleMovieMetadata(ctx) {
    const { movieName, } = ctx.params;
    const result = await this.metadataProvider.getPossibleMovies(movieName);
    ctx.body = result;
  }

  async getPossibleTvShowMetadata(ctx) {
    const { showName, } = ctx.params;
    const result = await this.metadataProvider.getPossibleTvShow(showName);
    ctx.body = result;
  }

  async addTvShowMetadata(ctx) {
    const { showName, } = ctx.params;
    const accountId = ctx.accountId;
    const metadata = ctx.request.body;
    await this.metadataFetcher.addTvShowMetadata(accountId, showName, metadata);
    ctx.status = 204;
  }

  async addTvEpisodeMetadata(ctx) {
    const { showName, season, episode, } = ctx.params;
    const accountId = ctx.accountId;
    const metadata = ctx.request.body;
    await this.metadataFetcher.addTvEpisodeMetadata(accountId, showName, season, episode, metadata);
    ctx.status = 204;
  }

  init() {
    this.router.get("/missing/:type/:subtype?", this.getMissingMetadata.bind(this));
    this.router.get("/movie/:movieName", this.getPossibleMovieMetadata.bind(this));
    this.router.put("/movie/:movieName", this.addMovieMetadata.bind(this));
    this.router.get("/tv/show/:showName", this.getPossibleTvShowMetadata.bind(this));
    this.router.put("/tv/show/:showName", this.addTvShowMetadata.bind(this));
    this.router.put("/tv/episode/:showName/:season/:episode", this.addTvEpisodeMetadata.bind(this));
  }
}

module.exports = MetadataApi;
