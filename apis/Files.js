class FilesApi {
    constructor(storageProvider, router) {
        this.router = router;
        this.init();
        this.storageProvider = storageProvider;
    }
    get(req, res, next) {
        let path = req.query.path;
        let listing = this.storageProvider.listFolders(path);
        res.json(listing);
    }

    getCache(req, res, next) {
        let listing = this.storageProvider.getCache();
        res.json(listing);
    }

    getRootFolderInfo(req, res, next) {
        let listing = this.storageProvider.getRootFolders();
        res.json(listing);
    }
    init() {
        this.router.get('/', this.get.bind(this));
        this.router.get('/cache', this.getCache.bind(this));
        this.router.get('/root', this.getRootFolderInfo.bind(this));
    }
}

export default FilesApi;