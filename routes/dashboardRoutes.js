const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');
const { Job, Entry } = require('../models');

// @desc    Show dashboard
// @route   GET /dashboard
router.get('/', ensureAuth, async (req, res) => {
    try {
        // Fetch user jobs
        const jobs = await Job.find({ userId: req.user._id }).lean();

        // Gather all entries related to those jobs in a single query
        const jobIds = jobs.map((j) => j._id);
        const entries = await Entry.find({ jobId: { $in: jobIds } }).lean();

        // Map jobId to entries
        const entryMap = {};
        entries.forEach((entry) => {
            const key = entry.jobId.toString();
            if (!entryMap[key]) entryMap[key] = [];
            entryMap[key].push(entry);
        });

        let grandTotalHours = 0;
        let grandTotalEarnings = 0;

        // Attach entries to each job & compute totals
        const jobsWithEntries = jobs.map((jobDoc) => {
            const job = { ...jobDoc, id: jobDoc._id.toString() };
            const jobEntries = entryMap[jobDoc._id.toString()] || [];
            job.entries = jobEntries;

            jobEntries.forEach((entry) => {
                grandTotalHours += entry.hours;
                grandTotalEarnings += entry.hours * job.hourlyRate + (entry.tip || 0);
            });

            return job;
        });

        res.render('dashboard', {
            userName: req.user.name,
            jobs: jobsWithEntries,
            grandTotalHours,
            grandTotalEarnings,
        });
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

// @desc    Add new job
// @route   POST /dashboard/add-job
router.post('/add-job', ensureAuth, async (req, res) => {
    try {
        await Job.create({
            jobName: req.body.jobName,
            hourlyRate: req.body.hourlyRate,
            userId: req.user._id,
        });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

module.exports = router; 