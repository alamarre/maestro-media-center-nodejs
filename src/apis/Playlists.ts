export default class PlaylistApi {
  constructor(private db) {
  }
  async list(ctx) {
    const listing = await this.db.list("user_data", ctx.username, ctx.profile, "playlists");
    ctx.body = (listing);
  }

  async get(ctx) {
    const { playlist, } = ctx.params;
    const playlistInfo = await this.db.get("user_data", ctx.username, ctx.profile, "playlists", playlist);
    ctx.body = (playlistInfo);
  }

  init(router) {
    router.get("/", this.list.bind(this));
    router.get("/:playlist", this.get.bind(this));
  }
}
