export default class ServersApi {
  constructor(private db) {
    this.db = db;
  }
  async list(ctx) {
    const listing = await this.db.list("servers");
    ctx.body = (listing);
  }

  init(router) {
    router.get("/", this.list.bind(this));
  }
}
