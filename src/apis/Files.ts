import IApi from "./IApi";
const Router = require("koa-router");

export default class FilesApi implements IApi {
  constructor(private storageProvider, private db, private filter) {
  }
  async get(ctx) {
    const path = ctx.query.path;
    const listing = await this.storageProvider.listFolders(path);
    ctx.body = (listing);
  }

  async getCache(ctx) {
    const listing = await this.storageProvider.getCache();
    let collections = [];
    try {
      const allCollections = await this.db.list("collections");
      collections = allCollections.map(c => c.collectionName);
    } catch (e) {
      console.error(e);
    }
    listing.folders["Movie Collections"] = { folders: [], files: collections, };
    let filtered = listing;
    if (this.filter) {
      filtered = await this.filter.getFilteredList(listing, ctx.username, ctx.profile);
    }
    ctx.body = filtered;
  }

  async getRootFolderInfo(ctx) {
    const listing = await this.storageProvider.getRootFolders();
    const newListing = listing.map(l => l);
    newListing.push({ "name": "Movie Collections", "type": "collection", path: "", });
    ctx.body = (newListing);
  }

  async getVideoSources(ctx) {
    const path = ctx.query.path;
    const result = await this.storageProvider.getVideoSources(path, ctx);
    ctx.body = result;
  }

  init(router) {
    router.get("/", this.get.bind(this));
    router.get("/cache", this.getCache.bind(this));
    router.get("/root", this.getRootFolderInfo.bind(this));
    router.get("/sources", this.getVideoSources.bind(this));
  }
}
