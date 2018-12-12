class FilesApi {
    constructor(storageProvider, db, router) {
        this.router = router;
        this.init();
        this.storageProvider = storageProvider;
        this.db = db;
    }
    async get(ctx) {
        const path = ctx.query.path;
        const listing = await this.storageProvider.listFolders(path);
        ctx.body = (listing);
    }

    async getCache(ctx) {
        const listing = await this.storageProvider.getCache();
        listing.folders["Movie Collections"] = {folders: [], files: (await this.db.list("collections")).map(c => c.collectionName),};
        ctx.body = (listing);
    }

    async getRootFolderInfo(ctx) {
        const listing = await this.storageProvider.getRootFolders();
        const newListing = listing.map(l =>l);
        newListing.push({"name": "Movie Collections", "type": "collection", path: "",});
        ctx.body = (newListing);
    }

    async getVideoSources(ctx) {
        const path = ctx.query.path;
        const result = await this.storageProvider.getVideoSources(path);
        ctx.body = result;
    }

    init() {
        this.router.get("/", this.get.bind(this));
        this.router.get("/cache", this.getCache.bind(this));
        this.router.get("/root", this.getRootFolderInfo.bind(this));
        this.router.get("/sources", this.getVideoSources.bind(this));
    }
}

module.exports=FilesApi;