import { inject, singleton } from "tsyringe";
import AuthTokenManager from "./AuthTokenManager";

const hostString = "http://localhost:8777/";
//const hostString = "https://maestro-web.al.workers.dev/";
const hostUri = new URL(hostString);
import parseSiren, { Entity } from "siren-parser";

@singleton()
export default class ApiCaller {
  private host: string;

  constructor(@inject(AuthTokenManager) private authTokenManager: AuthTokenManager) {
    this.host = hostUri.hostname;
  }

  getHost() {
    return hostString;
  }

  async fetch(path: string, options: Object = {}, parseEntity = true) : Promise<Entity> {
    const uri = new URL(path, hostString);
    const requestOptions: RequestInit = Object.assign({
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.authTokenManager.getToken()}`,
        //"X-Maestro-Profile": this.authTokenManager.getProfile()
      },
    }, options);
    const result = await fetch(uri.toString(), requestOptions);
    if(!parseEntity) {
      return await result.json();
    }
    const text = await result.text();
    const entity = parseSiren(text);
    return entity;
  }
}
