import B2FileSource from '../impl/backblaze/B2FileSource';
import IDatabase from '../database/IDatabase';
import IApi from './IApi';
const Router = require("koa-router");

export default class B2FilesApi implements IApi {
  constructor(private b2FileSource: B2FileSource, private db: IDatabase) {
  }

  async getInfoForUrl(ctx) {
    const { bucket, file, } = ctx.params;
    const result = await this.b2FileSource.getInfoForUrl(bucket, file);
    ctx.body = result;
  }

  init(router: typeof Router) {
    router.get("/:bucket/:file*", this.getInfoForUrl.bind(this));
  }
}
