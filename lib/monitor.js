
/**
 * Module dependencies
 */

var redis = require('./redis');

/**
 * Initializes a new work monitor to keep track of 
 * workers being monitored or reported upon.
 */

function WorkMonitor(options) {
    this.workers = [];
    this.intervals = [];
    this.redis = new redis.Manager(options || {});
}

exports.WorkMonitor = WorkMonitor;

/**
 * Runs a report interval for the given worker.
 *
 * @param {Worker} worker
 * @param {Number} reportIntervalMs
 * @api public
 */

WorkMonitor.prototype.report = function (worker, reportIntervalMs) {
}

/**
 * Runs a command queue loop to process items in a queue for 
 * the specified worker. This uses the standard command queue 
 * processor to gather commands and execute them for various 
 * workers currently loaded into the monitoring list.
 *
 * @param {Worker} worker
 * @param {Object} options
 * @api public
 */

WorkMonitor.prototype.commands = function (worker, options) {
};
