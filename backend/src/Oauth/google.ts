import passport from "passport";
import config from "config";
import { Strategy as GoogleStrategy, VerifyCallback } from 'passport-google-oauth2';
import User from "../models/User";
import { hashAndSaltPassword } from "../controllers/auth/controller";
import { randomUUID } from "crypto";
interface GoogleProfile {
  id: string;
  displayName: string;
  email: string;

  name: {
    familyName: string;
    givenName: string;
  };

  emails: Array<{
    value: string;
    verified: boolean;
  }>;

  photos: Array<{
    value: string;
  }>;

  provider: string;
  _raw: string;
  _json: any;
}


passport.use(new GoogleStrategy({
    clientID: config.get<string>('google.clientId'),
    clientSecret: config.get<string>('google.clientSecret'),
    callbackURL: "https://weezer.onrender.com/auth/google/callback",
    passReqToCallback: true
},
    async function (request, accessToken, refreshToken, profile: GoogleProfile, done: VerifyCallback) {
        try {
            const { email, displayName, id } = profile
            const [user, created] = await User.findOrCreate({
                where: { email },
                defaults: {
                    email,
                    googleId: id,
                    fullName: displayName,
                    name: displayName,
                    username: displayName,
                    password: hashAndSaltPassword(randomUUID())
                }
            })
            return done(null, user.get({ plain: true }))
        } catch(e) {
            console.log(e)
            done(e)
        }
    }
));

export default passport