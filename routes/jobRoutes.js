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
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        res.render('edit-job', { job, days, userName: req.user.name });
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

        // Group entries by week based on job's weekStartDay
        const weeklyEntries = {};
        const weekStartDayNum = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(job.weekStartDay);

        entries.forEach((entry) => {
            const date = new Date(entry.date);
            
            // Use UTC days to avoid timezone issues. The date from the form is timezone-naive.
            let dayOfWeek = date.getUTCDay();
            let difference = (dayOfWeek - weekStartDayNum + 7) % 7;
            
            let weekStartDate = new Date(date);
            weekStartDate.setUTCDate(date.getUTCDate() - difference);
            weekStartDate.setUTCHours(0, 0, 0, 0);
            
            const weekKey = weekStartDate.toISOString().split('T')[0];

            if (!weeklyEntries[weekKey]) {
                const weekEndDate = new Date(weekStartDate);
                weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);
                weeklyEntries[weekKey] = {
                    startDate: weekStartDate,
                    endDate: weekEndDate,
                    entries: [],
                    weeklyHours: 0,
                    weeklyTips: 0,
                    regularHours: 0,
                    overtimeHours: 0,
                    weeklyEarnings: 0
                };
            }
            weeklyEntries[weekKey].entries.push({ ...entry });
            weeklyEntries[weekKey].weeklyHours += entry.hours;
            weeklyEntries[weekKey].weeklyTips += entry.tip || 0;
        });

        // Calculate earnings including overtime for each week
        let totalEarningsWithOvertime = 0;
        const processedWeeklyEntries = Object.values(weeklyEntries).map(week => {
            const weeklyHours = week.weeklyHours;
            const hourlyRate = job.hourlyRate;
            const overtimeRate = hourlyRate * 1.5;

            if (weeklyHours > 40) {
                week.overtimeHours = weeklyHours - 40;
                week.regularHours = 40;
            } else {
                week.overtimeHours = 0;
                week.regularHours = weeklyHours;
            }

            const regularPay = week.regularHours * hourlyRate;
            const overtimePay = week.overtimeHours * overtimeRate;
            
            week.weeklyEarnings = regularPay + overtimePay + week.weeklyTips;
            totalEarningsWithOvertime += week.weeklyEarnings;
            return week;
        });
        
        // This recalculates the total job earnings to include overtime from all weeks.
        jobTotalEarnings = totalEarningsWithOvertime;

        res.render('job-tracker', {
            job,
            jobTotalHours,
            jobTotalEarnings,
            weeklyEntries: processedWeeklyEntries,
            userName: req.user.name,
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
        const job = await Job.findOne({ _id: req.params.id, userId: req.user._id });
        if (!job) {
            return res.render('error/404');
        }

        job.jobName = req.body.jobName || job.jobName;
        job.hourlyRate = req.body.hourlyRate || job.hourlyRate;
        job.weekStartDay = req.body.weekStartDay || job.weekStartDay;

        await job.save();

        if (req.body.from === 'edit-job') {
            res.redirect('/dashboard');
        } else {
            res.redirect(`/job/${req.params.id}`);
        }
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

module.exports = router; 