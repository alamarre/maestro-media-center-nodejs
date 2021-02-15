import Router = require("koa-router");
import { autoInjectable, inject, singleton } from "tsyringe";
import CollectionItem from "../../features/collections/CollectionItem";
import CollectionManager from "../../features/collections/CollectionManager";
import HMObject from "../../models/HMObject";
import canonicalize from "./canonicalize";
import { HMCollectionLink } from "./Links";

@singleton()
@autoInjectable()
export default class HMCollectionsApi {
  constructor(
    @inject(CollectionManager) private collectionManager?: CollectionManager,
  ) {
  }

  async getCollectionItems(ctx) {
    const collectionId = ctx.params.collectionId;
    const itemType = ctx.query.itemType;
    const children: CollectionItem[] = await this.collectionManager.getCollectionItems(collectionId, itemType);

    if (children.length == 0) {
      ctx.status = 404;
      return;
    }

    const response: HMObject = {
      links: [],
      class: ["collection"],
      actions: [],
      entities: children.map((v): HMObject => {
        const result = {
          class: ["collection-item"],
          links: [],
          entities: [],
          properties: {
            availableStartDate: v.availableStartDate,
            availableEndDate: v.availableEndDate,
            adjustDateRelatively: v.adjustDateRelatively,
            itemId: v.itemId,
          }
        }
        if (v.href) {
          result.links.push({
            rel: ["item"],
            href: canonicalize(v.href)
          })
        }

        if (v.childCollectionId) {
          result.entities.push(HMCollectionLink(ctx.profile, v.childCollectionId, "child-collection")
          );
        }
        return result;
      })
    };

    ctx.body = response;
  }

  init(router: Router) {
    router.get("/:collectionId(.*)", this.getCollectionItems.bind(this));
  }
}
