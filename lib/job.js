
/**
 * Module dependencies
 */

var events = require('events'),
    util = require('util');

/**
 * Creates a new job to be tracked for progress.
 *
 * @param {String} type
 * @param {Object} data
 * @api public
 */

function Job(type, data, options) {
    events.EventEmitter.call(this);
    this.type = type;
    this.data = data || {};
    this.redisManager = new redis.Manager(options.redis);
}

/** 
 * Inherits events.EventEmitter.
 */

util.inherits(Job, events.EventEmitter);

/**
 * Sets the job progress from the completed versus total.
 *
 * @param {Number} complete
 * @param {Number} total
 * @api public
 */

Job.prototype.progress = function (complete, total) {
    var n = Math.min(100, complete / total * 100 | 0);
    this.redisManager.set(this.id, "progress", n);
};


/**
 * Creates a new job to be tracked for progress.
 *
 * @param {String} type
 * @param {Object} data
 * @return {Job}
 * @api public
 */

exports.createJob = function (type, data, options) {
    return new Job(type, data, options);
};
