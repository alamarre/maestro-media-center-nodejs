class DirectoryListing {
	folders: string[];
	files : string[];

	constructor(folders: string[], files: string[]) {
		this.folders = folders;
		this.files = files;
	}
}

export default DirectoryListing;
