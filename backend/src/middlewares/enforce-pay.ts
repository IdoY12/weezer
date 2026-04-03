import { NextFunction, Request, Response } from "express";
import User from "../models/User";

/** Requires a paid subscription. Must run after enforceAuth (uses req.userId). */
export default async function enforcePay(req: Request, res: Response, next: NextFunction) {
    try {
        const user = await User.findByPk(req.userId, {
            attributes: ["isPay"],
        });
        if (!user || !user.isPay) {
            return next({ status: 403, message: "subscription required" });
        }
        next();
    } catch (e) {
        next(e);
    }
}
