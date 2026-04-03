import { randomBytes } from 'crypto'
import { NextFunction, Request, Response } from 'express'
import config from 'config'

const CSRF_COOKIE = 'csrf'

/** Whether the `Secure` flag is set on cookies (HTTPS-only). Driven by config, not process.env. */
export function secureCookiesEnabled(): boolean {
    return config.get<boolean>('app.secureCookies')
}

/**
 * Options for the CSRF double-submit cookie (`csrf`).
 * httpOnly is false on purpose: first-party JS must read the token and send it in `x-csrf-token` on mutating requests.
 * Other origins cannot read this cookie (browser same-origin policy for cookies).
 */
export function csrfCookieOptions() {
    return {
        httpOnly: false,
        secure: secureCookiesEnabled(),
        sameSite: 'strict' as const,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
    }
}

/**
 * Double-submit CSRF: issue a random token in a readable cookie and expect the same value in `x-csrf-token` on POST/PUT/PATCH/DELETE.
 */
export function issueCsrfCookie(res: Response): string {
    const token = randomBytes(32).toString('hex')
    res.cookie(CSRF_COOKIE, token, csrfCookieOptions())
    return token
}

/**
 * Reject mutating requests unless the CSRF cookie matches the `x-csrf-token` header (double-submit pattern).
 */
export default function csrfProtect(req: Request, res: Response, next: NextFunction) {
    const method = req.method.toUpperCase()
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return next()
    }

    const path = req.originalUrl.split('?')[0]
    if (path === '/stripe/webhook') {
        return next()
    }

    const cookieToken = req.cookies?.csrf
    const headerToken = req.get('x-csrf-token')
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return next({ status: 403, message: 'invalid csrf token' })
    }
    next()
}
