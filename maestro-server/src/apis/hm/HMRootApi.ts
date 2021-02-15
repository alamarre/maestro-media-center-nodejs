import Router = require("koa-router");
import { autoInjectable, singleton } from "tsyringe";
import HMObject from "../../models/HMObject";
import canonicalize from "./canonicalize";
import { HMCollectionLink, HMProfilesLink, HMVTvShowSourceLink } from "./Links";

@singleton()
@autoInjectable()
export default class HMRootApi {
  constructor() {
  }

  get(ctx) {
    const response: HMObject = {
      links: [],
      class: ["root"],
      actions: []
    };

    if (!ctx.username) {
      response.actions.push(
        {
          name: "login",
          class: ["login"],
          href: canonicalize("/api/v1.0/login"),
          method: "POST"
        });
    } else {
      response.links.push(HMProfilesLink);
    }
    ctx.body = response;
  }

  init(router: Router) {
    router.get("/", this.get.bind(this));
  }
}
