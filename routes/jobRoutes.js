const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../middleware/auth');
const { Job, Entry } = require('../models');

// @desc    Redirect from base /job to dashboard if no ID is provided
// @route   GET /job
router.get('/', ensureAuth, (req, res) => {
    res.redirect('/dashboard');
});

// @desc    Show edit job page
// @route   GET /job/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).lean();
        if (!job || job.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/dashboard');
        }
        job.id = job._id.toString();
        res.render('edit-job', { job });
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

// @desc    Show job-specific tracker page
// @route   GET /job/:id
router.get('/:id', ensureAuth, async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).lean();
        if (!job || job.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/dashboard');
        }
        // Add id field for EJS compatibility
        job.id = job._id.toString();

        const entries = await Entry.find({ jobId: req.params.id })
            .sort({ date: -1 })
            .lean();

        // Convert entry _id to id for each entry
        entries.forEach((e) => (e.id = e._id.toString()));

        let jobTotalHours = 0;
        let jobTotalEarnings = 0;

        entries.forEach((entry) => {
            jobTotalHours += entry.hours;
            jobTotalEarnings += entry.hours * job.hourlyRate + (entry.tip || 0);
        });

        // Group entries by week (Friday to Thursday)
        const weeklyEntries = {};
        entries.forEach((entry) => {
            const date = new Date(entry.date);
            let dayOfWeek = date.getDay();
            let difference = dayOfWeek < 5 ? dayOfWeek + 2 : dayOfWeek - 5;
            let weekStartDate = new Date(date);
            weekStartDate.setDate(date.getDate() - difference);
            weekStartDate.setHours(0, 0, 0, 0);
            
            const weekKey = weekStartDate.toISOString().split('T')[0];

            if (!weeklyEntries[weekKey]) {
                const weekEndDate = new Date(weekStartDate);
                weekEndDate.setDate(weekStartDate.getDate() + 6);
                weeklyEntries[weekKey] = {
                    startDate: weekStartDate,
                    endDate: weekEndDate,
                    entries: [],
                    weeklyHours: 0,
                    weeklyEarnings: 0,
                    weeklyTips: 0
                };
            }
            const dailyEarnings = entry.hours * job.hourlyRate + (entry.tip || 0);
            weeklyEntries[weekKey].entries.push({ ...entry, dailyEarnings });
            weeklyEntries[weekKey].weeklyHours += entry.hours;
            weeklyEntries[weekKey].weeklyEarnings += dailyEarnings;
            weeklyEntries[weekKey].weeklyTips += entry.tip || 0;
        });

        res.render('job-tracker', {
            job,
            jobTotalHours,
            jobTotalEarnings,
            weeklyEntries: Object.values(weeklyEntries)
        });
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

// @desc    Update job
// @route   POST /job/edit/:id
router.post('/edit/:id', ensureAuth, async (req, res) => {
    try {
        await Job.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { jobName: req.body.jobName, hourlyRate: req.body.hourlyRate },
            { new: true }
        );
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

// @desc    Add time entry
// @route   POST /job/:id/add-entry
router.post('/:id/add-entry', ensureAuth, async (req, res) => {
    try {
        await Entry.create({
            date: req.body.date,
            hours: req.body.hours,
            tip: req.body.tip || 0,
            jobId: req.params.id,
            userId: req.user._id,
        });
        res.redirect(`/job/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

// @desc    Delete job
// @route   POST /job/delete/:id
router.post('/delete/:id', ensureAuth, async (req, res) => {
    try {
        await Job.deleteOne({ _id: req.params.id, userId: req.user._id });
        await Entry.deleteMany({ jobId: req.params.id });
        res.redirect('/dashboard');
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

// @desc    Delete time entry
// @route   POST /job/delete-entry/:id
router.post('/delete-entry/:id', ensureAuth, async (req, res) => {
    try {
        const entry = await Entry.findById(req.params.id);
        if (!entry) return res.redirect('/dashboard');
        
        // Verify ownership via job relation
        const job = await Job.findById(entry.jobId).lean();
        if (!job || job.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/dashboard');
        }
        const jobId = entry.jobId;
        await entry.deleteOne();
        res.redirect(`/job/${jobId}`);
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

// @desc    Update hourly rate
// @route   POST /job/:id/update-rate
router.post('/:id/update-rate', ensureAuth, async (req, res) => {
    try {
        await Job.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { hourlyRate: req.body.hourlyRate },
            { new: true }
        );
        res.redirect(`/job/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.render('error/500');
    }
});

module.exports = router; 