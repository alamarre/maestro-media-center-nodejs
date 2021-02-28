import {LitElement, html, customElement, property} from "lit-element";
import {unsafeHTML} from 'lit-html/directives/unsafe-html.js';
import { Inject } from "../decorators/inject";
import { redirect, loadRouteFromPath } from "../decorators/location";
import ApiCaller from "../utilities/data/ApiCaller";
import { bindAttributeToEvent } from "../utilities/events/listen";
import "./Login";
import "./Homepage";
import "./ChooseProfile";
import { fireEvent } from "../utilities/events/create";
import AuthTokenManager from "../utilities/data/AuthTokenManager";

@customElement("maestro-app")
export default class MaestroApp extends LitElement  {
    @property({type: String})
    name = 'World';

    @property({type: String})
    authenticationUrl = null;

    @property({type: Object, attribute: false})
    currentRoute = null;

    @Inject(ApiCaller) apiCaller: ApiCaller;
    @Inject(AuthTokenManager) authTokenManager: AuthTokenManager;

    connectedCallback() {
        super.connectedCallback();
        this.fetchData();
        bindAttributeToEvent("maestro-url-update", this, "currentRoute");
    }

    async fetchData() {
        const response = await this.apiCaller.fetch("/api/hm");
        
        const loginUrl = response.getActionByName("login")?.href;

        if(loginUrl) {
            
            // this may redirect login to login, deal with it later
            redirect("login", true);
            fireEvent("maestro-login-url", loginUrl);
        } else if(!this.authTokenManager.getProfile()) {
            redirect("choose-profile", false);
        } else {
            loadRouteFromPath(window.location.hash.substring(1) || "/");
        }
    }

    render() {
        if(this.currentRoute) {
            const componentName = this.currentRoute.route.componentName;
            const componentData = unsafeHTML(`<${componentName}></${componentName}>`);
            return html`${componentData}`;
        }
        if(this.authenticationUrl) {
            return html`<maestro-login authenticationUrl="${this.authenticationUrl}"></maestro-login>`;
        }

        return html`
            <h4>${this.name}</h4>
        `;
    }
}