class TvShowsApi {
    constructor(videosMapper, router) {
        this.router = router;
        this.init();
        this.videosMapper = videosMapper;
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
    
    init() {
        this.router.get('/', this.get.bind(this));
    }
}

export default TvShowsApi;