import IQueryStringReader from "./IQueryStringReader";

export default class QueryStringReader implements IQueryStringReader {
  private parameters = {};
  constructor() {

  }

  parseParameters(queryString: string): { [key: string]: string } {
    if (queryString.indexOf("?") >= 0) {
      queryString = queryString.substring(queryString.indexOf("?") + 1);
    }
    var params = queryString.split("&");
    var results = {};
    for (var i = 0; i < params.length; i++) {
      var param = params[i].split("=");
      results[param[0]] = decodeURIComponent(param[1]);
    }
    return results;
  }

  private readQueryString(): void {
    var queryString = window.location.search.substring(1);
    this.parameters = this.parseParameters(queryString);
  }

  getParameter(name: string): string {
    this.readQueryString();
    return this.parameters[name];
  }

  getParameterFromUrl(url: string, name: string): string {
    const queryString = url.substring(url.indexOf("?") + 1);
    const parameters = this.parseParameters(queryString);
    return parameters[name];
  }
}
