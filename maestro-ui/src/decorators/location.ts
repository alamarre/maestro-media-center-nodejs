import { fireEvent } from "../utilities/events/create";
import { RoutingTree } from "../utilities/routing/RoutingTree";

class RouteObject {
    target: Object;
    path: string;
    componentName: string;
    name: string;
}
const routes : RouteObject[]= [];
const routeTree: RoutingTree<RouteObject> = new RoutingTree<RouteObject>("/");

let current : {parameters: Map<string, string>, route: RouteObject} = null;

export function route(path: string, componentName: string, name: string) {
    return (target: Object) => {
        const routeObject: RouteObject = {target, path, componentName, name};
        routes.push(routeObject);
        
        routeTree.addRoute({path: path, value: routeObject});
    }
}

export function redirect(locationName: string, returnToPath = false, pathParameters : Map<string,string> = new Map()) {
    const matches = routes.filter(r => r.name === locationName);
    if(matches.length === 1) {
        current = {route: matches[0], parameters: pathParameters};
        loadCurrentRoute();
    }
}

function loadCurrentRoute() {
    let hash = routeTree.applyParameters(current.route.path, current.parameters);
    history.pushState({}, "", `${window.location.pathname}#${hash}`);
    //window.location.hash = hash;
    fireEvent("maestro-url-update", current);
}

export function loadRouteFromPath(path: string) {
    const route = routeTree.matchPath(path.split("/"));
    if(route != null) {
        const parameters = routeTree.getParameterValues(route, path);
        current = {route: route.value, parameters};
        loadCurrentRoute();
    }
}

//loadRouteFromPath(window.location.hash.substring(1));

export const currentRoute = () => current;
