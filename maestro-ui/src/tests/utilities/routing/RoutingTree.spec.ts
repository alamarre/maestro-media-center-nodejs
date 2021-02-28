const assert = require('assert').strict;
import { RoutingTree, Route } from "../../../utilities/routing/RoutingTree";


const simpleRoute : Route<string> = {path: "/a/b/c/d", value: "abcd"};
const wildCardRoute : Route<string> = {path: "/a/b/*", value: "ab*"};
const specificWildCardRoute : Route<string> = {path: "/a/b/*/x", value: "ab*"};
const paramWildCardRoute : Route<string> = {path: "/a/{param}", value: "aparam*"};




describe('normal', function() {
    const tree : RoutingTree<string> = new RoutingTree<string>("");
    tree.addRoute(simpleRoute);
    tree.addRoute(wildCardRoute);
    tree.addRoute(specificWildCardRoute);
    tree.addRoute(paramWildCardRoute);
    it('should match simple route', function() {
       assert.equal(tree.match("/a/b/c/d"), simpleRoute);
    });

    it('should match wildcard', function() {
        assert.equal(tree.match("/a/b/x"), wildCardRoute);
     });

    it('should match wildcard with extra parameters', function() {
        assert.equal(tree.match("/a/b/x/d"), wildCardRoute);
     });

     it('should match specific wildcard', function() {
        assert.equal(tree.match("/a/b/x/x"), specificWildCardRoute);
     });

     it('should match param', function() {
        assert.equal(tree.match("/a/y"), paramWildCardRoute);
     });

     it('should match param with extras', function() {
        assert.equal(tree.match("/a/y/c/d"), paramWildCardRoute);
     });

     it('should map parameters', function() {
         const path = tree.applyParameters(paramWildCardRoute.path, new Map(Object.entries({param: "ahoy"})));
         assert.equal(path, "/a/ahoy");
     });

     it('should map simple params', function() {
        const result = tree.getParameterValues(paramWildCardRoute, "/a/ahoy");
        assert.equal(1, result.size);
        assert(result.has("param"));
        assert.equal("ahoy", result.get("param"));
    });

    it('should map param extras', function() {
        const result = tree.getParameterValues(paramWildCardRoute, "/a/ahoy/there");
        assert.equal(1, result.size);
        assert(result.has("param"));
        assert.equal("ahoy/there", result.get("param"));
    });
});