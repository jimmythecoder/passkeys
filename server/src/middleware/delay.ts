import { Request, Response, NextFunction } from "express";

export const delay = (_req: Request, _res: Response, next: NextFunction) => {
    setTimeout(next, parseInt(process.env.DELAY || "0", 10));
};

export default delay;
