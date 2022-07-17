export default class AccountApi {
  constructor() {
  }

  async get(ctx) {
    const accountDetails = { accountId: ctx.accountId, };
    ctx.body = accountDetails;
  }

  init(router) {
    router.get("/", this.get.bind(this));
  }
}
