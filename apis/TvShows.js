class TvShowsApi {
    constructor(videosMapper, db, router) {
        this.router = router;
        this.init();
        this.videosMapper = videosMapper;
        this.db = db;
    }

    get(req, res, next) {
        let path = req.query.path;
        if(req.query.season) {
            res.json(this.videosMapper.getEpisodes(req.query.show, req.query.season));
        } else if(req.query.show) {
            res.json(this.videosMapper.getSeasons(req.query.show));
        } else {
            res.json(this.videosMapper.getTvShows());
        }
    }

    listShowsInProgress(req, res, next) {
        res.json(this.db.list("user_data", req.username, req.profile, "tv_shows_keep_watching"));
    }

    postShowProgress(req, res, next) {
        let obj = req.body;
        this.db.set(obj, "user_data", req.username, req.profile, "tv_shows_keep_watching", obj.show);
        res.send("OK");
    }
    
    init() {
        this.router.get('/', this.get.bind(this));
        this.router.get('/keep-watching', this.listShowsInProgress.bind(this));
        this.router.post('/keep-watching', this.postShowProgress.bind(this));
    }
}

module.exports=TvShowsApi;