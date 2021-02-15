import { css, customElement, html, LitElement, property, query } from "lit-element";
import { Inject } from "../decorators/inject";
import { redirect, route } from "../decorators/location";
import ApiCaller from "../utilities/data/ApiCaller";
import AuthTokenManager from "../utilities/data/AuthTokenManager";
import { bindAttributeToEvent } from "../utilities/events/listen";

class LoginDetails {
    authenticationUrl: string;
    constructor() {
        bindAttributeToEvent("maestro-login-url", this, "authenticationUrl");
    }
}
const loginDetails = new LoginDetails();
@customElement("maestro-login")
@route("/login", `maestro-login`, "login")
export default class Login extends LitElement  {

    @property({type: String})
    authenticationUrl = loginDetails.authenticationUrl;

    @query('#username') _username;
    @query('#password') _password;

    @Inject(ApiCaller) apiCaller: ApiCaller;
    @Inject(AuthTokenManager) authTokenManager: AuthTokenManager;

    static get styles() {
        return css`
          label, input {
            display: block;
          }
        `;
      }

    login() {

    }

    async _handleClick(e: Event) {
        e.preventDefault();
        e.stopPropagation();

        const result : any = await this.apiCaller.fetch(loginDetails.authenticationUrl, {
            method: "POST",
            body: JSON.stringify({username: this._username.value, password: this._password.value})
        }, false);
        const {token} = result;
        this.authTokenManager.setToken(token);
        redirect("choose-profile");
        console.log(result);
    }

    render() {
        return html`<form >
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" />
            <label for="password">Password</label>
            <input type="password" id="password" name="password" />
            <button @click="${this._handleClick}" type="submit" >Login</button>
        </form>`;
    }
}