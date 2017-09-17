let fs = require("fs");
class VideosMapper {
    constructor(db, storageProvider, allowNonCachedTvShows) {
        this.db = db;
        this.storageProvider = storageProvider;
        this.cachedFolders = {"files": {}, "folders": {}};
        this.allowNonCachedTvShows = allowNonCachedTvShows;
    }

    loadCache() {
        this.cachedFolders = this.db.get("file_cache");
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
            }
        }
    }

    handleFolderAddEvent(folder, file) {
        let isFile = fs.lstatSync(folder.path +"/" + file).isFile();
        if(isFile) {
            this.addFileToCache(folder.name, file);
        } else {
            // recursively add files
            let queue = [file];
            while(queue.length > 0) {
                let nextPath = queue.shift();
                this.scanFolder(folder, nextPath, queue);
            }
        }
    }

    handleFolderDeleteEvent(folder, file) {
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
        let queue = [""];
        while(queue.length > 0) {
            let nextPath = queue.shift();
            this.scanFolder(rootFolder, nextPath, queue);
        }
    }

    scanFolder(folder, relativePath, queue) {
        let filesAndFolders = this.storageProvider.listFilesAndFolders(folder, relativePath);
        for(var i=0; i< filesAndFolders.files.length; i++) {
            let file = filesAndFolders.files[i];
            this.addFileToCache(folder.name, relativePath + "/" + file);
        }

        for(var i=0; i< filesAndFolders.folders.length; i++) {
            let folder = filesAndFolders.folders[i];
            let folderpath = relativePath + "/" + folder;
            if(folderpath.indexOf("/")==0) {
                folderpath = folderpath.substring(1);
            }
            queue.push(folderpath);
        }
    }

    addFileToCache(rootFolderName, relativePath) {
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

        currentParent.files[pathParts[pathParts.length -1]] = relativePath;
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
                if(folder.index) {
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
                if(folder.index) {
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
                if(folder.index) {
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

export default VideosMapper;