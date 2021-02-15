import {html, render} from "lit-html";

import  "./components/MaestroApp";

//customElements.define("maestro-app", MaestroApp);

const myTemplate = (name) => html`<maestro-app name="${name}"></maestro-app>`;

// Render the template to the document
render(myTemplate('Greetings!'), document.body);