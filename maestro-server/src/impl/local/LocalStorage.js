const DirectoryListing = require("../../models/DirectoryListing");
var fs = require("fs");
var watch = require("node-watch");
class LocalStorage {
    constructor(db) {
        this.db = db;
    }

    getRootFolders() {
        const result = this.db.list("root_folders");
        return result;
    }

    listFilesAndFolders(rootFolder, path) {
        path = rootFolder.path + "/" + path;
        return this.getListing(path);
    }

    watchFolderForChanges(folder, addCallback, deleteCallback) {
      // need to handle recursive for non mac and Windows later
      fs.watch(folder.path, {recursive: true,}, function(event, filename) {
          if(filename.indexOf(".DS_Store") < 0) {
              const root = folder.path.replace(/\\/g, "/");
              const normalizedFile = filename.replace(/\\/g, "/");
              let relativeFile = normalizedFile.indexOf(root) == 0 ? normalizedFile.substring(folder.path.length) : normalizedFile;
              if(relativeFile.indexOf("/")==0) {
                  relativeFile = relativeFile.substring(1);
              }
              if(fs.existsSync(`${folder.path}/${relativeFile}`)) {
                if(fs.lstatSync(`${folder.path}/${relativeFile}`).isDirectory()) {
                  return console.log(`detected, but ignoring folder ${folder.path}/${relativeFile}`);
                }
                addCallback(folder, relativeFile);
              } else {
                deleteCallback(folder, relativeFile);
              }
          }
      });
  }

    watchFolderForChangesLegacy(folder, addCallback, deleteCallback) {
        // need to handle recursive for non mac and Windows later
        watch(folder.path, {recursive: true,}, function(event, filename) {
            if(filename.indexOf(".DS_Store") < 0) {
                let relativeFile = filename.substring(folder.path.length);
                relativeFile = relativeFile.replace(/\\/g, "/");
                if(relativeFile.indexOf("/")==0) {
                    relativeFile = relativeFile.substring(1);
                }
                switch(event) {
                    case "update":
                        addCallback(folder, relativeFile);
                        break;
                    case "remove":
                        deleteCallback(folder, relativeFile);
                        break;
                }

            }
        });
    }

    listFolders(path) {
        const files = [];
        const folders = [];
        if (path == null || path == "") {
            const rootFolders = this.getRootFolders();
            for (const rootFolder of rootFolders) {
                folders.push(rootFolder.name);
            }
        }
        else {
            const realPath = this.getRealPath(path);

            if (realPath != null) {
                return this.getListing(realPath);
            }
        }
        return new DirectoryListing(folders, files);
    }

    getListing(path) {
        const files = [];
        const folders = [];
        if (fs.existsSync(path)) {
            var fileListing = fs.readdirSync(path);
            for (var file of fileListing) {
                file = file.replace(/\\/g, "/");
                const filePath = path + "/" + file;
                if(filePath.indexOf(".DS_Store") < 0) {
                    if (fs.lstatSync(filePath).isFile()) {
                        files.push(file);
                    }
                    else {
                        folders.push(file);
                    }
                }
            }
        }

        return new DirectoryListing(folders, files);
    }

    getRealPath(internalPath) {
        if (internalPath.indexOf("/") == 0) {
            internalPath = internalPath.substring(1);
        }
        const index = internalPath.indexOf("/");
        let name = internalPath.substring(0, index);
        let subPath = internalPath.substring(index + 1);
        if (name == "") {
            name = subPath;
            subPath = "";
        }
        const folders = this.getRootFolders();
        for (const folder of folders) {
            if (folder.name == name) {
                return folder.path + "/" + subPath;
            }
        }
        return null;
    }
}

module.exports = LocalStorage;
