const express = require('express');
const router = express.Router();
const { ensureGuest } = require('../middleware/auth');

// @desc    Show Landing Page
// @route   GET /
router.get('/', ensureGuest, (req, res) => {
    res.render('welcome');
});

module.exports = router; 