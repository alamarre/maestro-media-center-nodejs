const logger = require("../impl/logger").logger("TvShowsApi");

class TvShowsApi {
    constructor(db, router) {
        this.router = router;
        this.init();
        this.db = db;
    }

    async listShowsInProgress(ctx) {
        ctx.body = await this.db.list("user_data", ctx.username, ctx.profile, "tv_shows_keep_watching");
    }

    async postShowProgress(ctx) {
        const obj = ctx.request.body;
        obj.lastUpdated = new Date().getTime();
        logger.info("updated keep watching", {show: obj.show, epispode: obj.epispode, season: obj.season,});
        await this.db.set(obj, "user_data", ctx.username, ctx.profile, "tv_shows_keep_watching", obj.show);
        ctx.body = {result: "OK",};
    }
    
    init() {
        this.router.get("/keep-watching", this.listShowsInProgress.bind(this));
        this.router.post("/keep-watching", this.postShowProgress.bind(this));
    }
}

module.exports=TvShowsApi;