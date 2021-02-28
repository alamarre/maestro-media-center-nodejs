import { inject, injectable, singleton } from "tsyringe";
import IDatabase from "../../../database/IDatabase";
import IUserContext from "../../users/IUserContext";
import Folder from "../cache/Folder";
import S3CacheReader from "../cache/S3CacheReader";
import CollectionItem from "../CollectionItem";
import ICollectionPlugin from "../ICollectionPlugin";

@singleton()
@injectable()
export default class VideoCacheCollection implements ICollectionPlugin {
  constructor(
    @inject("IDatabase") private db?: IDatabase,
    @inject(S3CacheReader) private cacheReader?: S3CacheReader,
    @inject("IUserContext") private userContext?: IUserContext,
  ) {

  }
  providesCollection(collectionId: string): boolean {
    const parts = collectionId.split("/");
    if (parts.length >= 1 && parts[0] == "files") {
      return true;
    }
  }
  async getCollectionItems(collectionId: string, itemType?: string): Promise<CollectionItem[]> {
    const parts = collectionId.split("/");
    if (parts.length >= 1 && parts[0] == "files") {
      const path = parts.length === 1 ? null : collectionId.substring(collectionId.indexOf("/") + 1);
      const type = parts[2];
      const folder: Folder = await this.cacheReader.getFolderFromPath(path)
      const folderItems = Object.keys(folder.folders).map((folderName: string): CollectionItem => {
        return {
          itemId: `folder/${folderName}`,
          itemType: 'folder',
          href: `/api/hm/${this.userContext.getProfile()}/collections/${collectionId}/${folderName}`
        }
      });

      const fileItems = Object.keys(folder.files).map((fileName: string): CollectionItem => {
        return {
          itemId: `file/${fileName}`,
          itemType: 'file',
          href: `/api/hm/videos/${path}/${fileName}`
        }
      });

      return folderItems.concat(fileItems);

    }

    return [];
  }
}
