import IDatabase from "../database/IDatabase";
import IApi from "./IApi";
const Router = require("koa-router");

export default class ProfilesApi implements IApi {
  constructor(private db: IDatabase) {
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

  init(router: typeof Router) {
    router.get("/", this.get.bind(this));
    router.post("/", this.post.bind(this));
  }
}

