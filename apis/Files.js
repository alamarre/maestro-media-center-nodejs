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
    init() {
        this.router.get('/', this.get.bind(this));
    }
}

export default FilesApi;