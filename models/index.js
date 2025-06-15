'use strict';

// Replace previous Sequelize setup with a lightweight Mongoose aggregator so
// other modules can continue to import { User, Job, Entry } from '../models'.
// The actual connection to MongoDB is handled in server.js – this file simply
// registers/exports the schemas.

const User = require('./user');
const Job = require('./job');
const Entry = require('./entry');

module.exports = { User, Job, Entry };
