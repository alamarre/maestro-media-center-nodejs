import Router = require("koa-router");
import { autoInjectable, inject, singleton } from "tsyringe";
import IDatabase from "../../database/IDatabase";
import CollectionManager from "../../features/collections/CollectionManager";
import VideoProvider from "../../features/videos/video-types/VideoProvider";
import VideoSourceInfo from "../../features/videos/video-types/VideoSourceInfo";
import HMObject from "../../models/HMObject";
import canonicalize from "./canonicalize";
import { HMVideoLink, HMVideoTypeEntity } from "./Links";

@singleton()
@autoInjectable()
export default class HMVideosApi {
  constructor(
    @inject("IDatabase") private db?: IDatabase,
    @inject(VideoProvider) private videoProvider?: VideoProvider,
  ) {
  }

  async get(ctx) {
    const types = ["Movies", "TV Shows"];
    const response: HMObject = {
      links: [],
      class: ["video-types"],
      actions: [],
      entities: types.map((v): HMObject => {
        return HMVideoTypeEntity(v)
      })
    };

    ctx.body = response;
  }

  async getSources(ctx) {
    const videoId = ctx.params.videoId;
    const videoType = ctx.params.videoType;
    const source = await this.videoProvider.getSources(videoType, videoId);
    const result: HMObject = {
      class: ["video-sources"],
      properties: {
        subtitles: source.subtitles,
        sources: source.sources
      }
    };
    ctx.body = result;
  }


  init(router: Router) {
    router.get("/", this.get.bind(this));
    router.get("/:videoType/:videoId(.*)/sources", this.getSources.bind(this));
  }
}
