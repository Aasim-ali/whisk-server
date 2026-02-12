import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/index.js';

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists with this Google ID
            let user = await User.findOne({ where: { googleId: profile.id } });

            if (user) {
                // User exists, return it
                return done(null, user);
            }

            // Check if user exists with this email (for account linking)
            user = await User.findOne({ where: { email: profile.emails[0].value } });

            if (user) {
                // Link Google account to existing user
                user.googleId = profile.id;
                user.authProvider = 'google';
                user.profilePicture = profile.photos[0]?.value || null;
                await user.save();
                return done(null, user);
            }

            // Create new user
            user = await User.create({
                name: profile.displayName,
                email: profile.emails[0].value,
                googleId: profile.id,
                authProvider: 'google',
                profilePicture: profile.photos[0]?.value || null,
                password: null // No password for Google OAuth users
            });

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }));

export default passport;
