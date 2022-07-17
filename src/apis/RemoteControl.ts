export default class RemoteControlApi {
  constructor(private db, private userQueueManager) {
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

  init(router) {
    router.get("/devices", this.list.bind(this));
    router.get("/messages", this.get.bind(this));
    router.post("/messages", this.post.bind(this));
  }
}

module.exports = RemoteControlApi;
