class ServersApi {
    constructor(db, router) {
        this.router = router;
        this.init();
        this.db = db;
    }
    async list(ctx) {
        const listing = await this.db.list("servers");
        ctx.body = (listing);
    }

    init() {
        this.router.get("/", this.list.bind(this));
    }
}

module.exports = ServersApi;