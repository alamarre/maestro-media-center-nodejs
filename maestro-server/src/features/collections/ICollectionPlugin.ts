import CollectionItem from "./CollectionItem";

export default interface ICollectionPlugin {
  providesCollection(collectionId: string): boolean;
  getCollectionItems(collectionId: string, itemType?: string): Promise<CollectionItem[]>;
}
