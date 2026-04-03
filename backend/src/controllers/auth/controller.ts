import { NextFunction, Request, Response } from "express";
import User from "../../models/User";
import config from 'config'
import { createHmac } from "crypto";
import { sign, verify } from "jsonwebtoken";
import { issueCsrfCookie, csrfCookieOptions, secureCookiesEnabled } from "../../middlewares/csrf";

export function hashAndSaltPassword(plainTextPassword: string): string {
    const secret = config.get<string>('app.secret')
    return createHmac('sha256', secret).update(plainTextPassword).digest('hex')
    // return '7f7737fddd2842bc2afdbf1868aaa8e986b83133a1f010fe96535c15e4584628'
}

/** Endpoint for clients to obtain/refresh the CSRF cookie without a full auth round-trip. */
export function getCsrf(_req: Request, res: Response) {
    issueCsrfCookie(res)
    res.json({ ok: true })
}

export async function signup(req: Request, res: Response, next: NextFunction) {
    try {
        const jwtSecret = config.get<string>('app.jwtSecret')
        req.body.password = hashAndSaltPassword(req.body.password)
        const user = await User.create(req.body)
        const plainData = user.get({ plain: true })
        delete plainData.password
        const jwt = sign(plainData, jwtSecret)

        // Session cookie: set the signed JWT as the `jwt` cookie.
        // httpOnly=true: the token is not exposed to JavaScript via document.cookie, reducing XSS session theft.
        // secure=app.secureCookies: in production config, send only over HTTPS; off locally so http://localhost still works.
        // sameSite=strict: do not attach this cookie on cross-site navigations/subrequests (defense-in-depth vs CSRF).
        res.cookie('jwt', jwt, {
            httpOnly: true,
            secure: secureCookiesEnabled(),
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        // CSRF double-submit: set `csrf` cookie (see csrfCookieOptions: httpOnly=false so same-origin JS can read it and mirror it in x-csrf-token). Malicious other sites cannot read it (same-origin policy).
        issueCsrfCookie(res)

        res.json({ user: plainData })
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

        // Session cookie: signed JWT; httpOnly + sameSite + secure (from config) as in signup.
        res.cookie('jwt', jwt, {
            httpOnly: true,
            secure: secureCookiesEnabled(),
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        // Refresh/issue CSRF token for this session (double-submit cookie + header on mutating API calls).
        issueCsrfCookie(res)

        res.json({ user: plainData })
    } catch (e) {
        const err = e as Error
        if (err.message === 'invalid username and/or password') return next({
            status: 401,
            message: 'ya try ta hack us ha? no kidin'
        })
        next(e)
    }
}

export async function me(req: Request, res: Response, next: NextFunction) {
    try {
        const jwtSecret = config.get<string>('app.jwtSecret')
        const token = req.cookies?.jwt
        if (!token) return next({ status: 401, message: 'not authenticated' })
        const user = verify(token, jwtSecret)
        // Re-issue CSRF cookie so the client always has a fresh token while the session is valid.
        issueCsrfCookie(res)
        res.json({ user })
    } catch {
        next({ status: 401, message: 'invalid session' })
    }
}

export function logout(_req: Request, res: Response) {
    // Clear session cookie: options must match those used when setting `jwt` (including secure from config).
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: secureCookiesEnabled(),
        sameSite: 'strict',
    })
    // Clear CSRF cookie with the same attributes as issueCsrfCookie.
    res.clearCookie('csrf', csrfCookieOptions())
    res.json({ ok: true })
}
