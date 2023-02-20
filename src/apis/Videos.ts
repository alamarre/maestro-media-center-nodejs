export default class VideosApi {
  constructor(private cacheManager, private db) {
  }

  async getRecentVideos(ctx) {
    const result = await this.db.list("movie_added");
    ctx.body = result;
  }

  async addVideo(ctx) {
    const { type, rootUrl, } = ctx.request.body;
    let { path, } = ctx.request.body;
    if (path.startsWith("/")) {
      path = path.substring(1);
    }
    ctx.status = 204;
    const videoType = type.toLowerCase();
    if (videoType === "movie") {
      const moviePart = path.substring(path.lastIndexOf("/") + 1);
      await this.cacheManager.addMovie(moviePart, `${rootUrl}${path}`);
    } else if (videoType === "tv") {
      //await this.cacheManager.addTvShow(path, rootUrl);
      // skip root folder
      const [, showName, season, episode,] = path.split("/");
      await this.cacheManager.addEpisode(showName, season, episode, `${rootUrl}${path}`);
    } else {
      ctx.status = 400;
    }
  }

  async deleteVideo(ctx) {
    const { type, rootUrl, } = ctx.request.body;
    let { path, } = ctx.request.body;
    if (path.startsWith("/")) {
      path = path.substring(1);
    }
    ctx.status = 204;
    const videoType = type.toLowerCase();
    if (videoType === "movie") {
      const moviePart = path.substring(path.lastIndexOf("/") + 1);
      await this.cacheManager.deleteMovie(moviePart, `${rootUrl}${path}`);
    } else if (videoType === "tv") {
      //await this.cacheManager.addTvShow(path, rootUrl);
      // skip root folder
      const [, showName, season, episode,] = path.split("/");
      await this.cacheManager.deleteEpisode(showName, season, episode, `${rootUrl}${path}`);
    } else {
      ctx.status = 400;
    }
  }

  init(router) {
    router.post("/source", this.addVideo.bind(this));
    router.delete("/source", this.deleteVideo.bind(this));
    router.get("/recent", this.getRecentVideos.bind(this));
  }
}
