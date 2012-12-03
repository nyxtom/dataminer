
/**
 * Module dependencies
 */

var events = require('events'),
    util = require('util'),
    uuid = require('node-uuid');

/**
 * Creates a new job to be tracked for progress.
 *
 * @param {String} type
 * @param {Object} data
 * @api public
 */

function Job(type, options) {
    events.EventEmitter.call(this);
    this.id = "job:" + uuid.v1();
    this.type = type;
    this.redisManager = new redis.Manager(options.redis);
    this.redisManager.connect();
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
 * Queues the job data to redis.
 *
 * @param {Object} data to queue
 * @api public
 */

Job.prototype.queue = function (data) {
    this.redisManager.rPush(this.type, data);
};

/**
 * Creates a new job to be tracked for progress.
 *
 * @param {String} type
 * @param {Object} data
 * @return {Job}
 * @api public
 */

exports.createJob = function (type, options) {
    return new Job(type, options);
};
