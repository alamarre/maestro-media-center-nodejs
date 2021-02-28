import { bool } from "aws-sdk/clients/signer";

type CollectionItem = {
  itemId: string;
  itemType: string;
  childCollectionId?: string;
  href?: string;
  sortOrder?: number;
  availableStartDate?: string;
  availableEndDate?: string;
  adjustDateRelatively?: boolean;
}

export default CollectionItem;
