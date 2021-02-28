import { autoInjectable, inject, injectAll, singleton } from "tsyringe";
import IDatabase from "../../database/IDatabase";
import CollectionItem from "./CollectionItem";
import ICollectionPlugin from "./ICollectionPlugin";

@singleton()
@autoInjectable()
export default class CollectionManager {
  constructor(
    @inject("IDatabase") private db: IDatabase,
    @injectAll("ICollectionPlugin") private collectionPlugins?: ICollectionPlugin[]
  ) { }

  async getCollectionItems(collectionId: string, itemType?: string): Promise<CollectionItem[]> {
    const plugin = this.collectionPlugins.filter(c => c.providesCollection(collectionId));
    if (plugin.length === 1) {
      return await plugin[0].getCollectionItems(collectionId, itemType);
    }
    const keys = ["collection_items", collectionId];
    if (itemType) {
      keys.push(itemType);
    }

    return await this.db.list<CollectionItem>(...keys);
  }

  async ensureInCollection(item: CollectionItem, collectionId: string): Promise<void> {
    await this.db.addIfNotExists(item, "collection_items", collectionId, item.itemType, item.itemId);
  }

  async putItemInCollection(item: CollectionItem, collectionId: string): Promise<void> {
    await this.db.set(item, "collection_items", collectionId, item.itemType, item.itemId);
  }

  async removeFromCollection(item: CollectionItem, collectionId: string): Promise<void> {
    await this.db.delete("collection_items", collectionId, item.itemType, item.itemId);
  }
}
