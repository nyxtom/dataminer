
/**
 * Module dependencies
 */

var events = require('events'),
    check = require('validator').check;

var queue = require('./queue'),
    monitor = require('./monitor');

/**
 * Routine extension dependencies.
 */

var object = require('./utils/object');

/**
 * Module version
 */

exports.version = '0.1.2';

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
 * Returns the http module app.
 *
 * @api public
 */

var app;
Object.defineProperty(exports, 'app', {
    get: function () {
        return app || (app = require('./http'));
    }
});

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
    if (typeof n == 'object') {
        options = n;
        n = 1;
    }
    else if (typeof n == 'undefined') {
        n = 1;
    }

    // Set default worker options
    if (typeof options == 'object') {
        options = object.extend(default_options, options);
    }
    else {
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
 * @param {Worker} worker
 * @param {Object} options
 * @api public
 */

exports.monitor = function (worker, options) {
    monitor.report(worker, options);
};

/**
 * Registers a worker to be long-lived even when the 
 * process dies so that state can be maintained at all times 
 * for that worker.
 *
 * @param {Worker} worker
 * @param {String} id
 * @param {Object} options
 * @api public
 */

exports.register = function (worker, id, options) {
    monitor.register(worker, id, options);
};

/**
 * Unregisters a given worker id.
 *
 * @param {String} id
 * @param {Object} options
 * @api public
 */

exports.unregister = function (id, options) {
    monitor.unregister(id, options);
};

/**
 * Uses the dataminer.monitor to shutdown all 
 * workers safely and cleanly.
 *
 * @api public
 */

exports.shutdown = function () {
    monitor.shutdown();
    process.exit();
};

/**
 * Gracefully handle any shutdown execution.
 */
process.on('SIGTERM', function () {
    exports.shutdown();
});
process.on('SIGINT', function () { 
    exports.shutdown();
});
