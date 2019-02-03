class MetadataApi {
    constructor(router, db) {
        this.router = router;
        this.init();
        this.db = db;
    }

    async getMissingMetadata(ctx) {
        const {type, subtype,} = ctx.params;
        let result;
        if(type === "movie") {
            result = await this.db.list("possible_metadata", "movie");
        } else if (type === "tv") {
            result = await this.db.list("possible_metadata", "tv", subtype);
        }  
        
        if(!result) {
            return ctx.status = 404;
        }

        result = result.map(r => {
            const parts = r.key.split("/");
            const extra ={};
            if(type === "movie") {
                extra.movieName = parts[2];
            } else if (subtype==="show") {
                extra.showName = parts[3];
            } else if(subtype === "episode") {
                extra.showName = parts[3];
                extra.season = parts[4];
                extra.episode = parts[5];
            }
            
            const res = Object.assign({type, subtype,}, r, extra);
            delete res.key;
            return res;
        });

        ctx.body = result;
    }

    init() {
        this.router.get("/missing/:type/:subtype?", this.getMissingMetadata.bind(this));
    }
}

module.exports = MetadataApi;