const Router = require("koa-router");

export default interface IApi {
  init(router: typeof Router): void;
}
