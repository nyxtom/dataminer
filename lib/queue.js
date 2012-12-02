
/**
 * Module dependencies.
 */

var events = require('events'),
    util = require('util'),
    uuid = require('node-uuid'),
    redis = require('./redis'),
    job = require('./job');

/**
 * Initializes a new queue worker.
 *
 * @param {Stirng} queueName: the name of the queue being processed.
 * @param {Number} n: number of processes to run at once.
 * @param {Object} options: Extended options for the worker.
 * @return {QueueWorker}
 * @api public
 */

function QueueWorker(queueName, n, options) {
    var self = this;
    events.EventEmitter.call(this);

    this.n = n;
    this.options = options || {};
    this.name = this.options.name || queueName;
    this.id = this.options.id || "qw:" + uuid.v1();
    this.running = false;
    this.startTime = null;
    this.processCount = 0;
    this.redisManager = new redis.Manager(this.options.redis);
    this.redisManager.on('ready', function () {
        self.emit('ready');
    });
    this.redisManager.on('error', function (err) {
        self.running = false;
        self.emit('error', err);
        self.redisManager.backoffReconnect();
    });
};

/**
 * Inherit QueueWorker to event emitter.
 */

util.inherits(QueueWorker, events.EventEmitter);

/**
 * Cleanly shutsdown the worker.
 *
 * @emits shutdown
 * @api private
 */

QueueWorker.prototype._shutdown = function () {
    this.emit('shutdown');
    this.running = false;
    this.redisManager.quit();
};

/**
 * Executes the queue worker to live as long as the 
 * worker is running and perform any necessary backoff treatments.
 *
 * @api private
 */

QueueWorker.prototype._execute = function () {
    // Clean shutdown, ensures that the worker will end
    var self = this;
    if (!this.running) {
        this.emit('stopped');
        return;
    }

    try {
        this.redisManager.blpop(this.queueName, function (doc, err) {
            if (err) {
                // TODO: log based on this worker
            }
            else if (doc && doc.length > 1) {
                var data = JSON.parse(doc[1]);
                try {

                    // If progress is enabled, create a tracable job
                    // that can be tracked from start to finish,
                    // otherwise, pass data directly for high-volume
                    var job = data;
                    if (self.options.progress) {
                        job = Job.createJob(data, this);
                    }

                    // Runs the callback routine to process the job itself
                    this._callback(job, function (err) {
                        if (!err) {
                            self.processCount++;
                            self._execute();
                        }
                    });
                }
                catch (err) {
                    // TODO: note failed job, log for this worker
                    // TODO: allow for retries here
                }
            }
        });
    }
    catch (err) {
        // TODO: log based on this particular worker
    }
};

/**
 * Begins to process the queue appropriately.
 *
 * @param {Function} fn: callback for processing queue items.
 * @api public
 */

QueueWorker.prototype.process = function (fn) {
    var self = this;
    process.on('SIGINT', function () { self._shutdown(); });
    process.on('SIGTERM', function () { self._shutdown(); });
    this._callback = fn;
    this.redisManager.connect();
    this.on('ready', function () {
        self.running = true;
        self.stopTime = null;
        self.startTime = new Date().getTime();

        // TODO: use the n to process multiple execution routines at once
        self._execute();
    });
};

/**
 * Initializes and creates a new queue based worker.
 *
 * @param {Number} n: number of processes to run at once.
 * @param {Object} options: Extended options for the worker.
 * @return {QueueWorker}
 * @api public
 */

exports.createWorker = function (queueName, n, options) {
    var worker = new QueueWorker(queueName, n, options);
    return worker;
};
