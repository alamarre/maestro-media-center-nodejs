import ISimpleDb from "../../interfaces/ISimpleDb";
import IStorageProvider from "../../interfaces/IStorageProvider";
import RootFolder from "../../models/RootFolder";
import DirectoryListing from "../../models/DirectoryListing";
var fs = require('fs');

class LocalStorage implements IStorageProvider {
    private db : ISimpleDb;

    constructor(db: ISimpleDb) {
        this.db = db;
    }

    public getRootFolders() : RootFolder[] {
        let result : RootFolder[] = this.db.list("root_folders");
        return result;
    }

    public listFolders(path: string | null) : DirectoryListing {
        let files : string[] = [];
        let folders : string[] = [];

        if(path == null || path == "") {
            let rootFolders = this.getRootFolders();
            for(let rootFolder of rootFolders) {
                folders.push(rootFolder.name);
            }
        } else {
            let realPath = this.getRealPath(path);
            if(realPath != null) {
				if(fs.existsSync(realPath)) {
					var fileListing = fs.readdirSync(realPath);

					for(var file of fileListing) {
						let filePath = realPath + "/" + file;
						if(fs.lstatSync(filePath).isFile()) {
							files.push(file);
						} else {
							folders.push(file);
						}
					}
				}
            }
        }

        return new DirectoryListing(folders, files);
    }

    public getRealPath(internalPath: string) : string | null {
        if(internalPath.indexOf("/") == 0) {
            internalPath = internalPath.substring(1);
        }

        let index = internalPath.indexOf("/");

        let name = internalPath.substring(0, index);
        let subPath = internalPath.substring(index + 1);
		if(name == "") {
			name = subPath;
			subPath = "";
		}
        let folders = this.getRootFolders();
        for(let folder of folders) {
            if(folder.name == name) {
                return folder.path + "/" + subPath;
            }
        }

        return null;
    }
}

export default LocalStorage;