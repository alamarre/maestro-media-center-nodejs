import { parts } from "lit-html";

export class Route<T> {
    path: string;
    value: T;
}

export class RoutingTree<T> {
    private childCaches : Map<string, RoutingTree<T>> = new Map();
    private childRoutes : Map<string, Route<T>> = new Map();

    constructor(private basePath: string, private allowParamWildEnding = true) {
        if(this.basePath.startsWith("/")) {
            this.basePath = this.basePath.substring(1);
        }
    }

    match(path: string) : Route<T> {
        return this.matchPath(path.split("/"));
    }

    matchPath(pathParts: string[]) : Route<T> {
        if(pathParts.length > 0 && !pathParts[0]) {
            pathParts = pathParts.slice(1);
        }

        if (pathParts.length == 0) {
            return this.getBestRouteByWildcard(0);
        }
         
        const part = pathParts[0];
        if (pathParts.length == 1) {
            if (this.childRoutes.has(part)) {
                return this.childRoutes.get(part);
            }
        }
        const childParts = pathParts.slice(1);
        if (this.childCaches.has(part)) {
            //look for the most accurate page cache
            const result = this.childCaches.get(part).matchPath(childParts);
            if (result != null) {
                return result;
            }
        }

       if (this.childCaches.has("*")) {
            const result = this.childCaches.get("*").matchPath(childParts);
            if (result != null) {
                return result;
            }
        }

        if(this.childRoutes.has("*")) {
            const result : Route<T> = this.childRoutes.get("*");
            if(this.endsInTrueWildCard(result)|| pathParts.length==1) {
                return result;
            }
        }
        return null;
    }

    private getBestRouteByWildcard(offset: number) : Route<T> {
        if (this.childRoutes.has("*")) {
            const route = this.childRoutes.get("*");
            if (this.hasWildcardParameters(route.path, offset + 1)) {
                return route;
            }
            if(this.endsInTrueWildCard(route)) {
                return route;
            }
        }

        if (this.childCaches.has("*")) {
            const result = this.childCaches.get("*").getBestRouteByWildcard(offset + 1);
            if (this.endsInTrueWildCard(result)) {
                return result;
            }
        }

        return null;
    }

    private endsInTrueWildCard( r: Route<T>) : boolean {
        if (r != null) {
            const parts : string[] = r.path.split("/");
            if(this.allowParamWildEnding && this.isWildcard(parts[parts.length - 1])) {
                return true;
            }
            if (parts[parts.length - 1] == "*") {
                return true;
            }
        }
        return false;
    }

    private hasWildcardParameters(input : string, numberOfWildcardsExpected: number): boolean {
        if (input.startsWith("/")) {
            input = input.substring(1);
        }
        const parts = input.split("/");
        for (let i = 0; i < numberOfWildcardsExpected; i++) {
            if (i >= parts.length) {
                return false;
            }
            if (!this.isWildcardParameter(parts[parts.length - i - 1])) {
                return false;
            }
        }

        return true;
    }
    
    private isWildcardParameter(input: string) : boolean {
        return input.startsWith("{");
    }

    private isWildcard(input: string): boolean {
        return input.startsWith("{") || input == "*";
    }

    applyParameters(route: string, parameters : Map<string, string>) {
        let routeParts = route.split("/");
        if(!routeParts[0]) {
            routeParts= routeParts.slice(1);
        }
        
        let result = "";
        let wildCardCount = 0;
        for(let i =0; i< routeParts.length; i++) {
            if(!this.isWildcard(routeParts[i])) {
                result += `/${routeParts[i]}`;
            } else if(this.isWildcardParameter(routeParts[i])) {
                const parameterName = routeParts[i].substring(1, routeParts[i].length -1);
                result += `/${parameters.get(parameterName)}`;
            } else {
                result += `/${parameters.get(wildCardCount.toString())}`;
                wildCardCount++;
            }
        }

        return result;
    }

    getParameterValues(route: Route<T>, path: string) : Map<string, string> {
        const result : Map<string, string> = new Map();
        let parts = route.path.split("/");
        if(!parts[0]) {
            parts = parts.slice(1);
        }
        let wildCardCount = 0;

        let inputParts = path.split("/");
        if(!inputParts[0]) {
            inputParts = inputParts.slice(1);
        }
        let last = null;
        for(let i=0; i<parts.length && i<inputParts.length; i++) {
            if(this.isWildcard(parts[i])) {
                if(this.isWildcardParameter(parts[i])) {
                    result.set(parts[i].substring(1, parts[i].length-1), inputParts[i]);
                    last = parts[i].substring(1, parts[i].length-1);
                } else {
                    result.set(wildCardCount.toString(), inputParts[i]);
                    last = wildCardCount++;
                }
            }
        }
        if(parts.length < inputParts.length) {
            if(last) {
                result.set(last, [result.get(last)].concat(inputParts.slice(parts.length)).join("/"));
            } else {
                result.set("0", inputParts.slice(parts.length).join("/"));
            }
        }
        return result;
    }

    addRoute(route : Route<T>) : void {
        let path = route.path;
        if (path.startsWith("/")) {
            path = path.substring(1);
        }
        const partsOfRoute = path.split("/");
        //assume for efficiency sake that this belongs under us
        const start = this.basePath.split("/").filter(x => x!="").length;
        
        const subParts = partsOfRoute.slice(start);
        let part = subParts[0];
        if (this.isWildcard(part)) {
            part = "*";
        }
        if (subParts.length == 1) {
            this.childRoutes.set(part, route);
        } else {
            if (!this.childCaches.has(part)) {
                const cache = new RoutingTree<T>(this.basePath + "/" + part);
                this.childCaches.set(part, cache);
            }
            this.childCaches.get(part).addRoute(route);
        }
    }
}