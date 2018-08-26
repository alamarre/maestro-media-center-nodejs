class FilesApi {
    constructor(storageProvider, db, router) {
        this.router = router;
        this.init();
        this.storageProvider = storageProvider;
        this.db = db;
    }
    get(req, res) {
        const path = req.query.path;
        const listing = this.storageProvider.listFolders(path);
        res.json(listing);
    }

    getCache(req, res) {
        const listing = this.storageProvider.getCache();
        listing.folders["Movie Collections"] = {folders: [], files: this.db.list("collections").map(c => c.collectionName),};
        res.json(listing);
    }

    getRootFolderInfo(req, res) {
        const listing = this.storageProvider.getRootFolders();
        const newListing = listing.map(l =>l);
        newListing.push({"name": "Movie Collections", "type": "collection", path: "",});
        res.json(newListing);
    }
    init() {
        this.router.get("/", this.get.bind(this));
        this.router.get("/cache", this.getCache.bind(this));
        this.router.get("/root", this.getRootFolderInfo.bind(this));
    }
}

module.exports=FilesApi;