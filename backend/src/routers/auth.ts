import { Router } from "express";
import { login, signup, me, logout, getCsrf } from "../controllers/auth/controller";
import validation from "../middlewares/validation";
import { loginValidator, signupValidator } from "../controllers/auth/validator";
import passport from "../Oauth/google";
import { sign } from "jsonwebtoken";
import config from "config";
import { issueCsrfCookie, secureCookiesEnabled } from "../middlewares/csrf";

const router = Router()

router.get('/csrf', getCsrf)
router.post('/signup', validation(signupValidator), signup)
router.post('/login', validation(loginValidator), login)
router.get('/me', me)
router.post('/logout', logout)

router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'], 
    session: false
}));
// Only after the user approves Google login,
// Google redirects back here and this middleware is executed - and here we get the auth code
router.get('/google/callback', 
   // Passport take the auth code from req.query.code and exchanges the auth code for tokens
    // then Passport fetches the user's profile using the tokens (email, id, etc.)
  passport.authenticate('google', { 
    failureRedirect: '/login', 
    session: false
  }),
  function(req, res) {
    const jwtSecret = config.get<string>('app.jwtSecret')
    const clientOrigin = config.get<string>('app.clientOrigin')
    
    const {password, email, googleId, ...user} = req.user as any
    const jwt = sign(user, jwtSecret)
    // OAuth callback: same session + CSRF setup as password auth (JWT httpOnly cookie; CSRF readable by same-origin JS).
    res.cookie('jwt', jwt, {
        httpOnly: true,
        secure: secureCookiesEnabled(),
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    issueCsrfCookie(res)
    res.redirect(clientOrigin);
});

export default router
