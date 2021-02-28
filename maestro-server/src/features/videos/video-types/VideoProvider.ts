import { autoInjectable, inject, singleton } from "tsyringe";
import IDatabase from "../../../database/IDatabase";
import HMObject from "../../../models/HMObject";
import VideoSourceInfo from "./VideoSourceInfo";

@singleton()
@autoInjectable()
export default class VideoProvider {
  constructor(
    @inject("IDatabase") private db: IDatabase
  ) { }

  getInfo(type: string, videoId: string): HMObject {
    const properties = {};
    properties["name"] = videoId;

    const classNames = [];
    if (type == "TV Shows") {
      let videoType;
      const parts = videoId.split("/");

      if (parts.length > 0) {
        videoType = "TV Show";
        properties["show"] = parts[0];
        properties["name"] = parts[0];
      }

      if (parts.length > 1) {
        videoType = "TV Season";
        properties["season"] = parts[1];
        properties["name"] = parts[1];
      }

      if (parts.length > 0) {
        videoType = "TV Episode";
        properties["episode"] = parts[2];
        properties["name"] = parts[2];
      }
      classNames.push(videoType);
    } else {
      classNames.push(type);
    }

    return { properties, class: classNames };

  }

  async getSources(type: string, videoId: string): Promise<VideoSourceInfo> {

    return await this.db.get<VideoSourceInfo>("video_sources", type, ...videoId.split("/"));
  }


}
