import { autoInjectable, inject, injectable, singleton } from "tsyringe";
import IDatabase from "../../../database/IDatabase";
import KeepWatchingData from "../../keep-watching/KeepWatchingData";
import IUserContext from "../../users/IUserContext";
import CollectionItem from "../CollectionItem";
import ICollectionPlugin from "../ICollectionPlugin";

@singleton()
@injectable()
export default class KeepWatchingCollectionPlugin implements ICollectionPlugin {
  constructor(
    @inject("IDatabase") private db?: IDatabase,
    @inject("IUserContext") private userContext?: IUserContext,
  ) {

  }
  providesCollection(collectionId: string): boolean {
    const parts = collectionId.split("/");
    if (parts.length === 1 && parts[0] == "keep-watching") {
      return true;
    }
  }
  async getCollectionItems(collectionId: string, itemType?: string): Promise<CollectionItem[]> {
    const parts = collectionId.split("/");
    if (parts.length === 1 && parts[0] == "keep-watching") {
      const username = this.userContext.getUserName();
      const profile = this.userContext.getProfile();
      const items = await this.db.list<KeepWatchingData>("user_data", username, profile, "tv_shows_keep_watching")

      return items.sort((a, b) => b.lastUpdated - a.lastUpdated).map((i: KeepWatchingData, index) => {
        const show = i.show;

        let type;
        let id = show;
        if (show.startsWith("movie")) {
          type = "Movies";
          const parts = i.episode.split("/");
          if (parts.length == 2) {
            id = parts[1];
          }
        } else if (show == "collection") {
          type = "Collection";
          id = i.season;
        } else if (show == "playlist") {
          type = "Playlist";
          id = i.season;
        } else {
          type = "TV Shows";
          id = `${show}/${i.season}/${i.episode}`;
        }
        const href = `/api/hm/videos/${type}/${id}?autoplay=true`;
        const result: CollectionItem = {
          itemId: i["show"],
          itemType: "keep-watching",
          href,
          sortOrder: index
        }
        return result;
      });
    }

    return [];
  }
}
