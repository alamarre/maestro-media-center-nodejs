import IApi from "./IApi";
const Router = require("koa-router");

export default class HomepageCollectionsApi implements IApi {
  constructor(private db) {
  }
  async list(ctx) {
    const listing = await this.db.list("homepage_collections");
    ctx.body = (listing);
  }

  async get(ctx) {
    const { collection, } = ctx.params;
    const collectionInfo = await this.db.list("homepage_collection_items", collection);
    ctx.body = (collectionInfo);
  }

  init(router) {
    router.get("/", this.list.bind(this));
    router.get("/:collection", this.get.bind(this));
  }
}
