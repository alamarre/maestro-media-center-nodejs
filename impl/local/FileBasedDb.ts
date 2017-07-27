import ISimpleDb from "../../interfaces/ISimpleDb"

var fs = require('fs');

class FileBasedDb implements ISimpleDb {
	private rootPath: string;

	constructor(rootPath: string) {
		this.rootPath = rootPath;
	}

	private getKey(pathParts: string[]) {
		let parts = pathParts.unshift(this.rootPath);
		let path = pathParts.join("/");
		return path;
	}

	public get<T>(...path: string[]) {
		let file = this.getKey(path);
		
		if(fs.existsSync(file) && fs.lstatSync(file).isFile()) {
			let result : T = JSON.parse(fs.readFileSync(file));

			return result;
		}

		return null;
	}

	set<T>(value: T, ...path : string[]) {
		let file = this.getKey(path);
		fs.writeFileSync(file, JSON.stringify(value));
	}
	
	list<T>(...prefix: string[]) {
		let results : T[] = [];
		let directory = this.getKey(prefix);

		var files = fs.readdirSync(directory);

		for(var file of files) {
			let path: string = directory + "/" + file;
			if(fs.existsSync(path)) {
				let fileInfo = fs.lstatSync(path);
				if(fileInfo.isFile()) {
					try {
						results.push(JSON.parse(fs.readFileSync(path)));
					} catch(e) {
					}
				}
			}
		}

		return results;
	}
}

export default FileBasedDb;
