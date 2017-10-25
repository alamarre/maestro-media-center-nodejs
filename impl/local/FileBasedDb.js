var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');

class FileBasedDb {
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
    getKey(pathParts) {
        let parts = pathParts.unshift(this.rootPath);
        let path = pathParts.join("/");
        return path;
    }
    get(...pathParams) {
        let file = this.getKey(pathParams);
        if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
            let result = JSON.parse(fs.readFileSync(file));
            return result;
        }
        return null;
    }
    set(value, ...pathParams) {
        let file = this.getKey(pathParams);
        let parentDir = path.dirname(file);
        mkdirp.sync(parentDir);
        fs.writeFileSync(file, JSON.stringify(value));
    }
    list(...prefix) {
        let results = [];
        let directory = this.getKey(prefix);
        if(!fs.existsSync(directory)) {
            return [];
        }

        var files = fs.readdirSync(directory);
        for (var file of files) {
            let path = directory + "/" + file;
            if (fs.existsSync(path)) {
                let fileInfo = fs.lstatSync(path);
                if (fileInfo.isFile()) {
                    try {
                        results.push(JSON.parse(fs.readFileSync(path)));
                    }
                    catch (e) {
                    }
                }
            }
        }
        return results;
    }
}

export default FileBasedDb;