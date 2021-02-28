enum HTTP_METHODS {
  GET,
  PUT,
  POST,
  DELETE
}

type HttpMethod = keyof typeof HTTP_METHODS;

export class HMLink {
  rels: string[];
  href: string;
}

export class HMAction {
  name: string;
  class: string[];
  method: HttpMethod;
  href: string;
}

export default class HMObject {
  links?: HMLink[];
  entities?: (HMObject | HMLink)[];
  href?: string;
  rel?: string[];
  class: string[];
  properties?: { [key: string]: Object | Object[] };
  actions?: HMAction[];
}
