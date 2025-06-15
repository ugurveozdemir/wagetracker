const LocalStrategy = require('passport-local').Strategy;
const db = require('../models');

module.exports = function (passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                const user = await db.User.findOne({ email: email.toLowerCase() });
                if (!user) {
                    return done(null, false, { message: 'No user with that email' });
                }

                const isMatch = await user.matchPassword(password);
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            } catch (err) {
                return done(err);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await db.User.findById(id);
            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}; 