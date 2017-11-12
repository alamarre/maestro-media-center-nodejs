class ProfilesApi {
    constructor(db, router) {
        this.router = router;
        this.init();
        this.db = db;
    }

    get(req, res, next) {
        let profiles = this.db.list("profiles", req.username);
        res.json(profiles);
    }

    post(req, res, next) {
        let profileInfo = req.body;;
        this.db.set(profileInfo, "profiles", req.username, profileInfo.profileName);
        res.json(profileInfo);
    }

    init() {
        this.router.get('/', this.get.bind(this));
        this.router.post('/', this.post.bind(this));
    }
}

module.exports=ProfilesApi;