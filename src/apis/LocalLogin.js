const crypto = require("crypto");

class LocalLogin {
    constructor(db, userManager, router) {
        this.router = router;
        this.init();
        this.db = db;
        this.userManager = userManager;
    }
    async get(ctx) {
        let tokenValue = ctx.headers["X-Maestro-User-Token".toLowerCase()];
        if (typeof tokenValue != "string") {
            tokenValue = ctx.query["access_token"];
        }
        if (typeof tokenValue != "string") {
            ctx.status =401;
            ctx.body = JSON.stringify({ "status": "unauthenticated", });
        }
        else {
            const token = tokenValue;
            const username = await this.userManager.getUsername(token);
            if (username == null) {
                ctx.status =403;
                ctx.body = JSON.stringify({ "status": "unauthorized", });
            }
            else {
                ctx.body = JSON.stringify({ "username": username, });
            }
        }
    }
    async post(ctx) {
        const {username, password,} = ctx.request.body;
        const login = await this.login(username, password);
        ctx.state = login == null ? 403 : 200;
        ctx.body = JSON.stringify({ "token": login, });
    }
    async validateAuth(ctx, next) {
        // skip if no auth needed
        if (ctx.path == "/api/v1.0/login" || !ctx.path.startsWith("/api")) {
            await next();
            return;
        }
        let tokenValue = ctx.headers["X-Maestro-User-Token".toLowerCase()];
        if (typeof tokenValue != "string") {
            tokenValue = ctx.query["access_token"];
        }
        if (typeof tokenValue != "string") {
            ctx.status = 401;
            ctx.body = JSON.stringify({ "status": "unauthenticated", });
            return;
        }
        else {
            const token = tokenValue;
            const loginData = await this.userManager.getUser(token);
            const username = typeof loginData === "object" ? loginData.username : loginData;

            if (username == null) {
                ctx.status = 403;
                ctx.body = JSON.stringify({ "status": "unauthorized", });
                return;
            } else {
                ctx.username = username;
                ctx.accountId = typeof loginData === "object" ? loginData.accountId : null;
                ctx.profile = ctx.query["profile"];
            }
        }
        await next();
    }
    init() {
        this.router.get("/", this.get.bind(this));
        this.router.post("/", this.post.bind(this));
    }
    async login(username, password) {
        const hashData = await this.db.get("credentials", username);
        const hashPass = typeof hashData === "object" ? hashData.hashPass : hashData;
        const accountId = typeof hashData === "object" ? hashData.accountId : null;
        if (hashPass != null) {
            const hmac = crypto.createHash("sha256");
            const hash = hmac.update(password).digest("hex");
            if (hash.toLowerCase() == hashPass.toLowerCase()) {
                return this.userManager.createAuthToken(username, accountId);
            }
        }
        return null;
    }
}
module.exports=LocalLogin;