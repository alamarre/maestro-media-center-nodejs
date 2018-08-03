var fs = require("fs");
var mkdirp = require("mkdirp");
var path = require("path");

class FileBasedDb {
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
    getKey(pathParts) {
        pathParts.unshift(this.rootPath);
        const path = pathParts.join("/");
        return path;
    }
    get(...pathParams) {
        const file = this.getKey(pathParams);
        if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
            const result = JSON.parse(fs.readFileSync(file));
            return result;
        }
        return null;
    }
    set(value, ...pathParams) {
        const file = this.getKey(pathParams);
        const parentDir = path.dirname(file);
        mkdirp.sync(parentDir);
        fs.writeFileSync(file, JSON.stringify(value));
    }
    list(...prefix) {
        const results = [];
        const directory = this.getKey(prefix);
        if(!fs.existsSync(directory)) {
            return [];
        }

        var files = fs.readdirSync(directory);
        for (var file of files) {
            const path = directory + "/" + file;
            if (fs.existsSync(path)) {
                const fileInfo = fs.lstatSync(path);
                if (fileInfo.isFile()) {
                    try {
                        results.push(JSON.parse(fs.readFileSync(path)));
                    }
                    catch (e) {
                        console.error(e);
                    }
                }
            }
        }
        return results;
    }
}

module.exports = FileBasedDb;