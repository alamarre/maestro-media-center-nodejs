import { css, customElement, html, LitElement, property, query } from "lit-element";
import { Entity } from "siren-parser";
import { Inject } from "../decorators/inject";
import { redirect, route } from "../decorators/location";
import ApiCaller from "../utilities/data/ApiCaller";
import AuthTokenManager from "../utilities/data/AuthTokenManager";
import { bindAttributeToEvent } from "../utilities/events/listen";

@customElement("maestro-profile-chooser")
@route("/choose-profile", `maestro-profile-chooser`, "choose-profile")
export default class Login extends LitElement  {

    @property({type: Object, attribute: false})
    profiles = null;

    @Inject(ApiCaller) apiCaller: ApiCaller;
    @Inject(AuthTokenManager) authTokenManager: AuthTokenManager;

    static get styles() {
        return css`
          label, input {
            display: block;
          }
        `;
      }

    connectedCallback() {
        super.connectedCallback();
        this.loadData();
    }

    async loadData() {
        const rootEntity = await this.apiCaller.fetch("/api/hm");
        if(rootEntity.hasLinkByRel("profiles")) {
            const profileResponse = await this.apiCaller.fetch(rootEntity.getLinkByRel("profiles").href);
            
            this.profiles = profileResponse.entities;
        }
    }

    async _handleClick(profile: Entity) {
        const name = profile?.properties["name"];
        this.authTokenManager.setProfile(name);
        redirect("home");
    }

    render() {
        if(this.profiles) {
            return html`
                ${this.profiles.map((profile : Entity) => html`
                    <button @click="${() => this._handleClick(profile)}">
                        ${profile.properties["name"]}
                    </button>
                `)}
            `;
        }
        return html`<div>Loading profiles</div>`;
    }
}