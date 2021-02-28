import Router = require("koa-router");
import { autoInjectable, inject, singleton } from "tsyringe";
import IDatabase from "../../database/IDatabase";
import CollectionManager from "../../features/collections/CollectionManager";
import VideoProvider from "../../features/videos/video-types/VideoProvider";
import VideoSourceInfo from "../../features/videos/video-types/VideoSourceInfo";
import HMObject from "../../models/HMObject";
import canonicalize from "./canonicalize";
import { HMVideoInfoLink, HMVideoLink, HMVideoTypeEntity, makeSelfLink } from "./Links";

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

  async getVideoInfo(ctx) {
    const videoId = ctx.params.videoId;
    const videoType = ctx.params.videoType;
    if (videoType === "TV Show") {
      const show = videoId;
      const result: HMObject = {
        links: [
          makeSelfLink(HMVideoInfoLink(videoType, videoId))
        ],
        class: ["tv-show"],
        properties: {
          videoType,
          show,
        }
      };

      if (ctx.query.autoplay) {
        result.class.push("autoplay");
      }
      ctx.body = result;
    }
    const source = await this.videoProvider.getSources(videoType, videoId);
    const info: HMObject = await this.videoProvider.getInfo(videoType, videoId);
    const result: HMObject = {
      links: [
        makeSelfLink(HMVideoInfoLink(videoType, videoId))
      ],
      class: ["video-info"].concat(info["class"]),
      properties: Object.assign({
        videoType,
        subtitles: source.subtitles,
        sources: source.sources
      }, info.properties)
    };

    if (ctx.query.autoplay) {
      result.class.push("autoplay");
    }
    ctx.body = result;
  }


  init(router: Router) {
    router.get("/", this.get.bind(this));
    router.get("/:videoType/:videoId(.*)", this.getVideoInfo.bind(this));
  }
}
