import IUserManagement from "../interfaces/IUserManagement"
import ISimpleDb from "../interfaces/ISimpleDb";

import {Router, Request, Response, NextFunction} from 'express';
const crypto = require('crypto');

class LocalLogin {
    router: Router;
    private db : ISimpleDb;
    private userManager : IUserManagement;
    private salt : string;

    constructor(db: ISimpleDb, userManager : IUserManagement) {
        this.router = Router();
        this.init();
        this.db = db;
        this.userManager = userManager;
    }

    public get(req: Request, res: Response, next: NextFunction) {
        let tokenValue : string | string[] | undefined = req.headers["X-Maestro-User-Token".toLowerCase()];
        
        if(typeof tokenValue != "string") {
            res.status(401).json({"status": "unauthenticated"});
        } else {
            let token : string = tokenValue;
            let username : string | null = this.userManager.getUsername(token);
            if(username == null) {
                res.status(403).json({"status": "unauthorized"});
            } else {
                res.json({"username": username});
            }
        }
    }

    public post(req: Request, res: Response, next: NextFunction) {
        let login : string | null = this.login(req.body.username, req.body.password);
        
        res.status(login == null ? 403 : 200).json({"token": login});
    }

    public validateAuth(req: Request, res: Response, next: NextFunction) {
        // skip if no auth needed
        if(req.path == "/api/v1.0/login") {
            next();
            return;
        }
        let tokenValue : string | string[] | undefined = req.headers["X-Maestro-User-Token".toLowerCase()];
        if(typeof tokenValue != "string") {
            res.status(401).json({"status": "unauthenticated"});
            return;
        } else {
            let token : string = tokenValue;
            let username : string | null = this.userManager.getUsername(token);
            if(username == null) {
                res.status(403).json({"status": "unauthorized"});
                return;
            } 
        }
        
        next();
    }

    init() {
        this.router.get('/', this.get.bind(this));
        this.router.post('/', this.post.bind(this));
    }

    private login(username: string, password: string): string | null {
        let hashPass : string | null = this.db.get("credentials", username);
        if(hashPass != null) {
            const hmac = crypto.createHash('sha256');
            let hash = hmac.update(password).digest('hex');
            if(hash == hashPass) {
                return this.userManager.createAuthToken(username);
            }
        }

        return null;
    }
}

export default LocalLogin;