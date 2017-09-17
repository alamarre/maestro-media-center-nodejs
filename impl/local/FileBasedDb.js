var fs = require('fs');

class FileBasedDb {
    constructor(rootPath) {
        this.rootPath = rootPath;
    }
    getKey(pathParts) {
        let parts = pathParts.unshift(this.rootPath);
        let path = pathParts.join("/");
        return path;
    }
    get(...path) {
        let file = this.getKey(path);
        if (fs.existsSync(file) && fs.lstatSync(file).isFile()) {
            let result = JSON.parse(fs.readFileSync(file));
            return result;
        }
        return null;
    }
    set(value, ...path) {
        let file = this.getKey(path);
        fs.writeFileSync(file, JSON.stringify(value));
    }
    list(...prefix) {
        let results = [];
        let directory = this.getKey(prefix);
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