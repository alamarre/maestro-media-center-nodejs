const als = require("async-local-storage");
import IUserContext from "./IUserContext";

export default class UserContext implements IUserContext {
  getUserName(): string {
    return als.get("username");
  }
  getProfile(): string {
    return als.get("profile");
  }

}
