class CollectionsApi {
    constructor(db, router) {
        this.router = router;
        this.init();
        this.db = db;
    }
    list(req, res) {
        const listing = this.db.list("collections");
        res.json(listing);
    }

    get(req, res) {
        const { collection, } = req.params;
        const collectionInfo = this.db.get("collections", collection);
        res.json(collectionInfo);
    }

    init() {
        this.router.get("/", this.list.bind(this));
        this.router.get("/:collection", this.get.bind(this));
    }
}

module.exports = CollectionsApi;