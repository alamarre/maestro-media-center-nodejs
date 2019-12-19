class HomepageCollectionsApi {
  constructor(router, db) {
    this.router = router;
    this.init();
    this.db = db;
  }

  async deleteEntry(ctx) {
    const { name, type, collection, } = ctx.params;
    const accountId = ctx.accountId;
    await this.db.delete(accountId, "homepage_collection_items", collection, type, name);
    ctx.status = 200;
  }

  async deleteCollection(ctx) {
    const { collection, } = ctx.params;
    const accountId = ctx.accountId;
    await this.db.delete(accountId, "homepage_collections", collection);
    ctx.status = 200;
  }

  async addEntry(ctx) {
    const { name, type, collection, } = ctx.params;
    const accountId = ctx.accountId;
    const metadata = ctx.request.body;
    await this.db.set(metadata, accountId, "homepage_collection_items", collection, type, name);
    ctx.status = 204;
  }

  async list(ctx) {
    const listing = await this.db.list("homepage_collections");
    ctx.body = (listing);
  }

  async get(ctx) {
    const { collection, } = ctx.params;
    const collectionInfo = await this.db.list("homepage_collection_items", collection);
    ctx.body = (collectionInfo);
  }

  init() {
    this.router.get("/", this.list.bind(this));
    this.router.get("/:collection", this.get.bind(this));
    this.router.delete("/:collection", this.deleteCollection.bind(this));
    this.router.delete("/:collection/:type/:name", this.deleteEntry.bind(this));
    this.router.put("/:collection/:type/:name", this.addEntry.bind(this));
  }
}

module.exports = HomepageCollectionsApi;
