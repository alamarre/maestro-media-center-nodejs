class HomepageCollectionsApi {
  constructor(db, router) {
    this.router = router;
    this.init();
    this.db = db;
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
  }
}

module.exports = HomepageCollectionsApi;
