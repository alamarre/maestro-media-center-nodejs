class AccountApi {
    constructor(router) {
        this.router = router;
        this.init();
    }

    async get(ctx) {
        const accountDetails = {accountId: ctx.accountId,};
        ctx.body = accountDetails;
    }

    init() {
        this.router.get("/", this.get.bind(this));
    }
}

module.exports = AccountApi;