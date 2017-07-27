import {Router, Request, Response, NextFunction} from 'express';
import IStorageProvider from "../interfaces/IStorageProvider"

export class FilesApi {
  router: Router;
	private storageProvider : IStorageProvider;

  constructor(storageProvider: IStorageProvider) {
    this.router = Router();
    this.init();
		this.storageProvider = storageProvider;
  }

  public get(req: Request, res: Response, next: NextFunction) {
    let path = req.query.path;
    let listing = this.storageProvider.listFolders(path);
    res.json(listing);
  }

  init() {
    this.router.get('/', this.get.bind(this));
  }
}

export default FilesApi;
