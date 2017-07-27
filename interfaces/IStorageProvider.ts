import DirectoryListing from "../models/DirectoryListing"

interface IStorageProvider {
	listFolders(rootPath: string | null) : DirectoryListing;
}

export default IStorageProvider;