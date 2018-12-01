class CollectionsApi {
    constructor(db, router) {
        this.router = router;
        this.init();
        this.db = db;
    }
    async list(ctx) {
        const listing = this.db.list("collections");
        ctx.body = (listing);
    }

    async get(ctx) {
        const { collection, } = ctx.params;
        const collectionInfo = this.db.get("collections", collection);
        ctx.body = (collectionInfo);
    }

    init() {
        this.router.get("/", this.list.bind(this));
        this.router.get("/:collection", this.get.bind(this));
    }
}

module.exports = CollectionsApi;