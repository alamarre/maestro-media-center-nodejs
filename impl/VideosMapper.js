let fs = require("fs");
class VideosMapper {
    constructor(db, storageProvider, allowNonCachedTvShows, oneTimePassNonWatchable) {
        this.db = db;
        this.storageProvider = storageProvider;
        this.cachedFolders = {"files": {}, "folders": {}};
        this.allowNonCachedTvShows = allowNonCachedTvShows;
        this.oneTimePassNonWatchable = oneTimePassNonWatchable;
    }

    loadCache() {
        this.cachedFolders = this.db.get("file_cache");
    }

    getCache() {
        return this.cachedFolders;
    }

    getRootFolders() {
        let rootFolders = this.storageProvider.getRootFolders();
        return rootFolders;
    }

    scanIndexedFolders() {
        this.cachedFolders = {"files": {}, "folders": {}};
        let folders = this.getRootFolders();
        for(var i =0; i<folders.length; i++) {
            let folder = folders[i];
            if(folder.index) {
                this.scanFoldersUsingQueue(folder);

                this.storageProvider.watchFolderForChanges(
                    folder, 
                    this.handleFolderAddEvent.bind(this),
                    this.handleFolderDeleteEvent.bind(this));
            } else if(this.oneTimePassNonWatchable) {
                this.scanFoldersUsingQueue(folder);
            }
        }
    }
    
    listFolders(path) {
        if(path.startsWith("/")) {
            path = path.substring(1);
        }
        
        let parts = path.split("/");
        let root = parts.shift();
        let cache = this.getCachedListing({name: root}, parts.join("/"));
        return {
            folders: Object.keys(cache.folders),
            files: Object.keys(cache.files)
        };
    }

    handleFolderAddEvent(folder, file) {
        console.log(`detected addition of ${file} in ${folder.name}`);
        let isFile = fs.lstatSync(folder.path +"/" + file).isFile();
        if(isFile) {
            this.addFileToCache(folder.name, file);
        } else {
            // recursively add files
            let parent = this.getParent(folder.name, file+"/");

            let queue = [{parent: parent, path: file}];
            
            while(queue.length > 0) {
                let next = queue.shift();
                this.scanFolder(folder, next.parent, next.path, queue, false);
            }
        }
    }

    handleFolderDeleteEvent(folder, file) {
        console.log(`detected delete of ${file} from ${folder.name}`);
        let parentFolderName = "";
        let filename = file;
        if(file.indexOf("/") >= 0) {
            parentFolderName = file.substring(0, file.lastIndexOf("/"));
            filename = file.substring(file.lastIndexOf("/")+1);
        }

        let parentFolder = this.getCachedListing(folder, parentFolderName);
        if(parentFolder.folders[filename]) {
            delete parentFolder.folders[filename];
        } else if (parentFolder.files[filename]) {
            delete parentFolder.files[filename];
        } 
    }

    scanFoldersUsingQueue(rootFolder) {
        this.cachedFolders.folders[rootFolder.name] = {"files": {}, "folders": {}};
        let queue = [{path: "", parent:  this.cachedFolders.folders[rootFolder.name]}];
        while(queue.length > 0) {
            let next = queue.shift();
            this.scanFolder(rootFolder, next.parent, next.path, queue);
        }
    }

    scanFolder(folder, parent, relativePath, queue, log) {
        let filesAndFolders = this.storageProvider.listFilesAndFolders(folder, relativePath);
        
        if(log) {
            console.log(relativePath);
            console.log(JSON.stringify(filesAndFolders));
        }

        for(var i=0; i< filesAndFolders.files.length; i++) {
            let file = filesAndFolders.files[i];
            this.addFileToCache(folder.name, relativePath + "/" + file);
        }

        for(var i=0; i< filesAndFolders.folders.length; i++) {
            let currentFolder = filesAndFolders.folders[i];
            let folderpath = relativePath + "/" + currentFolder;
            if(folderpath.indexOf("/")==0) {
                folderpath = folderpath.substring(1);
            }
            parent.folders[currentFolder] = {"files": {}, "folders": {}};
            queue.push({path: folderpath, parent: parent.folders[currentFolder]});
        }
    }

    addFileToCache(rootFolderName, relativePath) {
        if(relativePath.indexOf("/") == 0) {
            relativePath = relativePath.substring(1);
        }

        let parent = this.getParent(rootFolderName, relativePath);

        let pathParts = relativePath.split("/");
        parent.files[pathParts[pathParts.length -1]] = relativePath;
    }

    getParent(rootFolderName, relativePath) {
        if(relativePath.indexOf("/") == 0) {
            relativePath = relativePath.substring(1);
        }

        let pathParts = relativePath.split("/");
        let currentParent = this.cachedFolders;
        pathParts.unshift(rootFolderName);
        for(var i=0; i < pathParts.length -1; i++) {
            if(!currentParent.folders[pathParts[i]]) {
                currentParent.folders[pathParts[i]] = {"files": {}, "folders": {}};
            }
            currentParent = currentParent.folders[pathParts[i]];
        }

        return currentParent;
    }

    getTvShowListPromise() {
        let promise = new Promise(function(success, error) {

        });
        return promise;
    }

    getTvShows() {
        let uniqueList = {};
        let folders = this.getRootFolders();
        for(var i =0; i<folders.length; i++) {
            let folder = folders[i];
            if(folder.type == "TV") {
                let currentShows = [];
                if(folder.index || this.oneTimePassNonWatchable) {
                    currentShows = this.getCachedListing(folder, "").folders;
                } else if (this.allowNonCachedTvShows) {
                    currentShows = this.storageProvider.listFilesAndFolders(folder, "").folders;
                }
                for(var show in currentShows) {
                    uniqueList[show] =true;
                }
            }
        }

        return Object.keys(uniqueList);
    }

    getSeasons(showName) {
        let uniqueList = {};
        let folders = this.getRootFolders();
        for(var i =0; i<folders.length; i++) {
            let folder = folders[i];
            if(folder.type == "TV") {
                let currentSeasons = [];
                if(folder.index || this.oneTimePassNonWatchable) {
                    currentSeasons = this.getCachedListing(folder, showName).folders;
                    
                } else if (this.allowNonCachedTvShows) {
                    currentSeasons = this.storageProvider.listFilesAndFolders(folder, showName).folders;
                }
                for(var show in currentSeasons) {
                    uniqueList[show] =true;
                }
            }
        }

        return Object.keys(uniqueList);
    }

    getCachedListing(folder, relativePath) {
        if(relativePath.indexOf("/") == 0) {
            relativePath = relativePath.substring(1);
        }

        if(!folder || folder.name  == "") {
            return this.cachedFolders;
        }

        let pathParts = relativePath.split("/");
        let currentParent = this.cachedFolders;
        pathParts.unshift(folder.name);

        if(!relativePath || relativePath == "") {
            pathParts = [folder.name];
        }

        for(var i=0; i < pathParts.length; i++) {
            if(!currentParent.folders[pathParts[i]]) {
                return null;
            }

            currentParent = currentParent.folders[pathParts[i]]
        }

        return currentParent;
    }

    getEpisodes(showName, season) {
        let uniqueList = {};
        let folders = this.getRootFolders();
        for(var i =0; i<folders.length; i++) {
            let folder = folders[i];
            if(folder.type == "TV") {
                let currentEpisodes = [];
                if(folder.index || this.oneTimePassNonWatchable) {
                    currentEpisodes = this.getCachedListing(folder, showName+"/"+season).files;
                    
                } else if (this.allowNonCachedTvShows) {
                    currentEpisodes = this.storageProvider.listFilesAndFolders(folder, showName+"/"+season).files;
                }
                for(var show in currentEpisodes) {
                    uniqueList[show] =true;
                }
            }
        }

        return Object.keys(uniqueList);
    }
}

module.exports = VideosMapper;