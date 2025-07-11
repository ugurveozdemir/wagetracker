'use strict';
const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    jobName: {
      type: String,
      required: true,
      trim: true,
    },
    hourlyRate: {
      type: Number,
      required: true,
      min: 0,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    weekStartDay: {
      type: String,
      required: true,
      default: 'Friday', // Default to Friday, can be changed in settings
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Job || mongoose.model('Job', JobSchema); 