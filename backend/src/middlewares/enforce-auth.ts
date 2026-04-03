import { NextFunction, Request, Response } from "express";
import { verify } from "jsonwebtoken";
import config from 'config'
import User from "../models/User";
import Joi from "joi";

declare global {
    namespace Express {
        interface Request {
            userId: string
        }
    }
}

export default function enforceAuth(req: Request, res: Response, next: NextFunction) {

    const jwtSecret = config.get<string>('app.jwtSecret')

    const token = req.cookies?.jwt

    if (!token) return next({
        status: 401,
        message: 'not authenticated',
    })

    try {
        const user = verify(token, jwtSecret) as User
        req.userId = user.id
        console.log(user)
        next()

    } catch {
        next({
            status: 401,
            message: 'invalid session',
        })
    }
}
