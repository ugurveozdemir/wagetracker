const express = require('express');
const router = express.Router();
const passport = require('passport');
const { ensureGuest } = require('../middleware/auth');
const { User } = require('../models');

// @desc    Show login/register page
// @route   GET /
router.get('/', ensureGuest, (req, res) => {
    // Prevent caching of the login page
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '-1');
    res.render('auth', { message: req.flash('error') });
});

// @desc    Register user
// @route   POST /auth/register
router.post('/register', ensureGuest, async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            req.flash('error', 'User with that email already exists.');
            return res.redirect('/auth');
        }
        await User.create({ name, email, password });
        req.flash('success_msg', 'You are now registered and can log in.');
        res.redirect('/auth');
    } catch (err) {
        console.error(err);
        res.redirect('/auth');
    }
});

// @desc    Login user
// @route   POST /auth/login
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', info.message);
            return res.redirect('/auth');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

// @desc    Logout user
// @route   POST /auth/logout
router.post('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) {
                return next(err);
            }
            res.clearCookie('connect.sid'); // clear the session cookie
            res.redirect('/');
        });
    });
});

module.exports = router; 