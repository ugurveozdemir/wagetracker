const express = require('express');
const router = express.Router();
const passport = require('passport');
const { User } = require('../models');

// @desc    Show login/register page
// @route   GET /auth
router.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        return res.redirect('/dashboard');
    }
    res.render('auth', { message: req.flash('error') });
});

// @desc    Register user
// @route   POST /auth/register
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.redirect('/auth'); // Or show an error
        }
        await User.create({ name, email, password });
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
// @route   GET /auth/logout
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        res.redirect('/auth');
    });
});

module.exports = router; 