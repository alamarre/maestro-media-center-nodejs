import { customElement, html, LitElement } from "lit-element";
import { route } from "../decorators/location";

@customElement("maestro-home")
@route("/home", `maestro-home`, "home")
export default class MaestroApp extends LitElement  {
    render() {
        return html`welcome to the jungle`;
    }
}