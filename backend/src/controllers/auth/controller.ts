import { NextFunction, Request, Response } from "express";
import User from "../../models/User";
import config from 'config'
import { createHmac } from "crypto";
import { sign } from "jsonwebtoken";

export function hashAndSaltPassword(plainTextPassword: string): string {
    const secret = config.get<string>('app.secret')
    return createHmac('sha256', secret).update(plainTextPassword).digest('hex')
    // return '7f7737fddd2842bc2afdbf1868aaa8e986b83133a1f010fe96535c15e4584628'
}

export async function signup(req: Request, res: Response, next: NextFunction) {
    try {
        const jwtSecret = config.get<string>('app.jwtSecret')
        req.body.password = hashAndSaltPassword(req.body.password)
        const user = await User.create(req.body)
        const plainData = user.get({ plain: true })
        delete plainData.password
        const jwt = sign(plainData, jwtSecret)
        res.json({ jwt })
    } catch (e: any) {
        // Handle Sequelize unique constraint errors
        if (e.name === 'SequelizeUniqueConstraintError') {
            const errors = e.errors || []
            const field = errors[0]?.path || ''
            
            if (field === 'username') {
                return next({
                    status: 422,
                    message: 'Username already exists. Please choose a different username.'
                })
            } else if (field === 'email') {
                return next({
                    status: 422,
                    message: 'Email already exists. Please use a different email address.'
                })
            } else {
                return next({
                    status: 422,
                    message: 'A user with this information already exists.'
                })
            }
        }
        
        // Handle other Sequelize validation errors
        if (e.name === 'SequelizeValidationError') {
            const errors = e.errors || []
            const firstError = errors[0]
            if (firstError) {
                return next({
                    status: 422,
                    message: firstError.message || 'Validation error'
                })
            }
        }
        
        next(e)
    }
}

export async function login(req: Request, res: Response, next: NextFunction) {
    try {
        const jwtSecret = config.get<string>('app.jwtSecret')

        const user = await User.findOne({
            where: {
                username: req.body.username,
                password: hashAndSaltPassword(req.body.password)
            }
        })
        if (!user) throw new Error('invalid username and/or password')
        const plainData = user.get({ plain: true })
        delete plainData.password
        const jwt = sign(plainData, jwtSecret)
        res.json({ jwt })
    } catch (e) {
        if (e.message === 'invalid username and/or password') return next({
            status: 401,
            message: 'ya try ta hack us ha? no kidin'
        })
        next(e)
    }
}
