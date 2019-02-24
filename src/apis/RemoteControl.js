class RemoteControlApi {
    constructor(db, router, userQueueManager) {
        this.router = router;
        this.init();
        this.db = db;
        this.userQueueManager = userQueueManager;
    }

    async list(ctx) {
        ctx.body = await this.userQueueManager.getDevices(ctx.username);
    }

    async get(ctx) {
        const { device, } = ctx.query;
        const messages = await this.userQueueManager.getMessages(ctx.username, device);
        ctx.body = messages;
    }

    async post(ctx) {
        const { device, message, } = ctx.request.body;
        await this.userQueueManager.sendMessage(ctx.username, device, message);
        ctx.status = 204;
    }

    init() {
        this.router.get("/devices", this.list.bind(this));
        this.router.get("/messages", this.get.bind(this));
        this.router.post("/messages", this.post.bind(this));
    }
}

module.exports = RemoteControlApi;