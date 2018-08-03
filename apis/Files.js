class FilesApi {
    constructor(storageProvider, router) {
        this.router = router;
        this.init();
        this.storageProvider = storageProvider;
    }
    get(req, res) {
        const path = req.query.path;
        const listing = this.storageProvider.listFolders(path);
        res.json(listing);
    }

    getCache(req, res) {
        const listing = this.storageProvider.getCache();
        res.json(listing);
    }

    getRootFolderInfo(req, res) {
        const listing = this.storageProvider.getRootFolders();
        res.json(listing);
    }
    init() {
        this.router.get("/", this.get.bind(this));
        this.router.get("/cache", this.getCache.bind(this));
        this.router.get("/root", this.getRootFolderInfo.bind(this));
    }
}

module.exports=FilesApi;