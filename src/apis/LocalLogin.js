const crypto = require("crypto");

class LocalLogin {
    constructor(db, userManager, router) {
        this.router = router;
        this.init();
        this.db = db;
        this.userManager = userManager;
    }
    get(req, res) {
        let tokenValue = req.headers["X-Maestro-User-Token".toLowerCase()];
        if (typeof tokenValue != "string") {
            tokenValue = req.query["access_token"];
        }
        if (typeof tokenValue != "string") {
            res.status(401).json({ "status": "unauthenticated", });
        }
        else {
            const token = tokenValue;
            const username = this.userManager.getUsername(token);
            if (username == null) {
                res.status(403).json({ "status": "unauthorized", });
            }
            else {
                res.json({ "username": username, });
            }
        }
    }
    post(req, res) {
        const login = this.login(req.body.username, req.body.password);
        res.status(login == null ? 403 : 200).json({ "token": login, });
    }
    validateAuth(req, res, next) {
        // skip if no auth needed
        if (req.path == "/api/v1.0/login" || !req.path.startsWith("/api")) {
            next();
            return;
        }
        let tokenValue = req.headers["X-Maestro-User-Token".toLowerCase()];
        if (typeof tokenValue != "string") {
            tokenValue = req.query["access_token"];
        }
        if (typeof tokenValue != "string") {
            res.status(401).json({ "status": "unauthenticated", });
            return;
        }
        else {
            const token = tokenValue;
            const username = this.userManager.getUsername(token);
            if (username == null) {
                res.status(403).json({ "status": "unauthorized", });
                return;
            } else {
                req.username = username;
                req.profile = req.query["profile"];
            }
        }
        next();
    }
    init() {
        this.router.get("/", this.get.bind(this));
        this.router.post("/", this.post.bind(this));
    }
    login(username, password) {
        const hashPass = this.db.get("credentials", username);
        if (hashPass != null) {
            const hmac = crypto.createHash("sha256");
            const hash = hmac.update(password).digest("hex");
            if (hash == hashPass) {
                return this.userManager.createAuthToken(username);
            }
        }
        return null;
    }
}
module.exports=LocalLogin;