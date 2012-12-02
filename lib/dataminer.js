
/**
 * Module dependencies
 */

var events = require('events'),
    check = require('validator');

var queue = require('./queue'),
    monitor = require('./monitor');

var check = validator.check;

/**
 * Module version
 */

exports.version = '0.1.0';

/**
 * dataminer.QueueWorker
 */

exports.queue = queue;


/**
 * dataminer.WorkMonitor
 */

exports.monitor = monitor;

/**
 * Default worker options.
 *
 * @return {Object}
 * @api private
 */
var default_options = {
    redis: {
        host: 'localhost',
        port: 6379,
        options: {}
        //, auth: XXXX
    },
    report: true,
    reportIntervalMs: 1000,
    commands: true
};

/**
 * Creates a new queue worker with the given parameters.
 *
 * @param {String} queueName
 * @param {Number} n
 * @param {Object} options
 * @return {QueueWorker}
 * @api public
 */

exports.createQueue = function (queueName, n, options) {
    check(queueName).isAlpha();

    if (typeof n == 'object') {
        options = n;
        n = 1;
    }
    else if (typeof n == 'undefined') {
        n = 1;
    }

    // Set default worker options
    if (typeof options == 'undefined') {
        options = default_options;
    }
    if (typeof options.name != 'string') {
        options.name = queueName;
    }
    if (typeof options.report != 'boolean') {
        options.report = true;
    }
    if (typeof options.reportIntervalMs != 'number') {
        options.reportIntervalMs = 1000;
    }

    // Create the worker from the queue and 
    // determine whether or not to report on 
    // regular intervals as well as respond 
    // to various commands.
    var worker = queue.createWorker(queueName, n, options);
    if (options.report) {
        monitor.report(worker, options);
    }
    return worker;
};

/**
 * Monitors a given worker to have the worker 
 * periodically report on a specified interval.
 *
 * @param {Object} options
 * @api public
 */

exports.monitor = function (worker, options) {
    monitor.report(worker, options);
};
