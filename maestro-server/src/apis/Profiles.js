class ProfilesApi {
    constructor(db, router) {
        this.router = router;
        this.init();
        this.db = db;
    }

    async get(ctx) {
        const profiles = await this.db.list("profiles", ctx.username);
        ctx.body = (profiles);
    }

    async post(ctx) {
        const profileInfo = ctx.request.body;
        await this.db.set(profileInfo, "profiles", ctx.username, profileInfo.profileName);
        ctx.body = (profileInfo);
    }

    init() {
        this.router.get("/", this.get.bind(this));
        this.router.post("/", this.post.bind(this));
    }
}

module.exports=ProfilesApi;