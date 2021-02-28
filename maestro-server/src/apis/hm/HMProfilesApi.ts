import Router = require("koa-router");
import { autoInjectable, inject, singleton } from "tsyringe";
import IDatabase from "../../database/IDatabase";
import HMObject, { HMLink } from "../../models/HMObject";
import canonicalize from "./canonicalize";
import { HMCollectionLink, HMProfileLink, HMProfilesLink, HMVTvShowSourceLink, makeSelfLink } from "./Links";

@singleton()
@autoInjectable()
export default class HMProfilesApi {
  constructor(
    @inject("IDatabase") private db?: IDatabase,
  ) {
  }

  private formatProfile(p) {
    const profileEntity: HMObject = {
      class: ["profile"],
      properties: {
        name: p["profileName"]
      },
      links: [
        makeSelfLink(HMProfileLink(p["profileName"]))
      ]
    };
    return profileEntity;
  }

  async get(ctx) {
    const profiles = await this.db.list("profiles", ctx.username);
    const response: HMObject = {
      class: ["profiles"],
      links: [makeSelfLink(HMProfilesLink)],
      entities: profiles.map(p => makeSelfLink(HMProfileLink(p["profileName"]))),
    };

    ctx.body = response;
  }

  async getProfile(ctx) {
    const profileName = ctx.params.profile;
    const profile = await this.db.get("profiles", ctx.username, profileName);
    const response = this.formatProfile(profile);

    response.links.push(HMCollectionLink(profileName, "homepage_collections", "homepage-collections"));
    ctx.body = response;
  }

  init(router: Router) {
    router.get("/", this.get.bind(this));
    router.get("/:profile", this.getProfile.bind(this));
  }
}
