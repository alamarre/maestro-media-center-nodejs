import {Request, Response, NextFunction} from "express";

export let health = (req: Request, res: Response, next: NextFunction) => {
	res.json({"errors": "0"})
}
