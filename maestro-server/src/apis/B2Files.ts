import B2FileSource from '../impl/backblaze/B2FileSource';
import IDatabase from '../database/IDatabase';

export default class B2FilesApi {
  constructor(private router, private b2FileSource: B2FileSource, private db: IDatabase) {
    this.init();
  }


  async getInfoForUrl(ctx) {
    const { bucket, file, } = ctx.params;
    const result = await this.b2FileSource.getInfoForUrl(bucket, file);
    ctx.body = result;
  }

  init() {
    this.router.get("/:bucket/:file*", this.getInfoForUrl.bind(this));
  }
}
