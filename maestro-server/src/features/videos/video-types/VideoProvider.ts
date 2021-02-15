import { autoInjectable, inject, singleton } from "tsyringe";
import IDatabase from "../../../database/IDatabase";
import VideoSourceInfo from "./VideoSourceInfo";

@singleton()
@autoInjectable()
export default class VideoProvider {
  constructor(
    @inject("IDatabase") private db: IDatabase
  ) { }

  async getSources(type: string, videoId: string): Promise<VideoSourceInfo> {

    return await this.db.get<VideoSourceInfo>("video_sources", type, ...videoId.split("/"));
  }


}
