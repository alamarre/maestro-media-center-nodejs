import B2FileSource from '../../impl/backblaze/B2FileSource';
import IDatabase from '../../database/IDatabase';

export default class B2FilesApi {
  constructor(private router, private b2FileSource: B2FileSource, private db: IDatabase) {
    this.init();
  }

  async getBuckets(ctx) {
    const result = await this.b2FileSource.getBuckets();
    ctx.body = result;
  }

  async startBigFile(ctx) {
    const { bucket, fileName } = ctx.params;
    const result = await this.b2FileSource.startBigFile(bucket, fileName);
    ctx.body = result;
  }

  async getUploadPart(ctx) {
    const { apiUrl, authorizationToken, fileId } = ctx.request.body;
    const result = await this.b2FileSource.getUploadPart(apiUrl, authorizationToken, fileId);
    ctx.body = result;
  }

  async getUploadUrl(ctx) {
    const { bucket } = ctx.request.body;
    const result = await this.b2FileSource.getUploadUrl(bucket);
    ctx.body = result;
  }

  async finishUpload(ctx) {
    const { apiUrl, authorizationToken, fileId, shas } = ctx.request.body;
    const result = await this.b2FileSource.finishUpload(apiUrl, authorizationToken, fileId, shas);
    ctx.body = result;
  }

  async getInfoForUrl(ctx) {
    const { bucket, } = ctx.params;
    const result = await this.b2FileSource.getAuthorization(bucket);
    ctx.body = result;
  }

  init() {
    this.router.get("/credentials/:bucket", this.getInfoForUrl.bind(this));
    this.router.get("/buckets", this.getBuckets.bind(this));
    this.router.post("/files/:bucket/:fileName", this.startBigFile.bind(this));
    this.router.put("/files/complete", this.finishUpload.bind(this));
    this.router.post("/files/get_upload_part_url", this.getUploadPart.bind(this));
    this.router.post("/files/get_upload_url", this.getUploadUrl.bind(this));
  }
}
