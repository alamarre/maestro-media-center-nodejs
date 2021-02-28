import { inject, injectable, singleton } from "tsyringe";
import IDatabase from "../../../database/IDatabase";
import CollectionItem from "../CollectionItem";
import ICollectionPlugin from "../ICollectionPlugin";
import NewMovie from "./NewMovie";

@singleton()
@injectable()
export default class NewMoviesCollectionPlugin implements ICollectionPlugin {
  constructor(
    @inject("IDatabase") private db?: IDatabase,
  ) {

  }
  providesCollection(collectionId: string): boolean {
    const parts = collectionId.split("/");
    if (parts.length === 1 && parts[0] == "new-movies") {
      return true;
    }
  }
  async getCollectionItems(collectionId: string, itemType?: string): Promise<CollectionItem[]> {
    const parts = collectionId.split("/");
    if (parts.length === 1 && parts[0] == "new-movies") {
      const items = await this.db.list<NewMovie>("movie_added");


      return items.sort((a, b) => b.time - a.time).map((i: NewMovie, index) => {

        const href = `/api/hm/videos/Movies/${i.movie}`;
        const result: CollectionItem = {
          itemId: i.movie,
          itemType: "new-movie",
          href,
          sortOrder: index
        }
        return result;
      });
    }

    return [];
  }
}
