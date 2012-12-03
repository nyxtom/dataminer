
/**
 * Module dependencies
 */

var events = require('events'),
    util = require('util');
    redis = require('./redis');

/**
 * Initializes a new work monitor to keep track of 
 * workers being monitored or reported upon.
 */

function WorkMonitor() {
    events.EventEmitter.call(this);
    this.workers = [];
    this.reportIntervalMs = 1000;
    this.reportInterval = null;
    this.redisManager =  null;
    this.lastUpdate = null;
    this.ppsZLimit = 30;
}

/**
 * Inherit from events.EventEmitter
 */

util.inherits(WorkMonitor, events.EventEmitter);


/**
 * Expose WorkMonitor as a singleton.
 */

exports.WorkMonitor = WorkMonitor;
exports.WorkMonitor.singleton = new WorkMonitor();

/**
 * Manages the initialization and hook routines 
 * for the work monitor connections and intervals.
 *
 * @param {Object} options
 * @api private
 */

WorkMonitor.prototype._initialize = function (options) {
    var self = this;
    this.options = options || {};
    this.redisManager = new redis.Manager(this.options.redis);
    this.redisManager.on('ready', function () {
        self.emit('ready');
    });
    this.redisManager.connect();
};

/**
 * Safe shutdown routine to close off any existing intervals 
 * and safely disconnect from clients.
 *
 * @api private
 */

exports.shutdown = function () {
    WorkMonitor.singleton.shutdown();
};

WorkMonitor.prototype.shutdown = function () {
    try {
        clearInterval(this.reportInterval);
        for (var i = 0; i < this.workers.length; i++) {
            if (typeof this.workers[i].shutdown == 'function')
                this.workers[i].shutdown();
            this.redisManager.del("dm:workers:pps:" + this.workers[i].id);
            this.redisManager.hDel("dm:workers", this.workers[i].id);
        }
        this.redisManager.quit();
    }
    catch (err) { }
};

/**
 * Runs a report interval for the given worker.
 *
 * @param {Worker} worker
 * @param {Object} options
 * @api public
 */

exports.report = function (worker, options) {
    WorkMonitor.singleton.report(worker, options);
}

WorkMonitor.prototype.report = function (worker, options) {
    if (!this.redisManager) {
        this._initialize(options);
    }

    var found = false;
    for (var i = 0; i < this.workers.length; i++) {
        if (this.workers[i] == worker) {
            found = true;
            break;
        }
    }
    if (!found) {
        this.workers.push(worker);

        if (!this.reportInterval)
            this._beginInterval();
    }
};

/**
 * Begins the report interval routine.
 *
 * @api private
 */

WorkMonitor.prototype._beginInterval = function () {
    var self = this;
    this.reportInterval = setInterval(function () {
        self._report();
    }, self.reportIntervalMs);
};


/**
 * Reports for all workers currently being tracked.
 *
 * @api private
 */

WorkMonitor.prototype._report = function () {
    for (var i = 0; i < this.workers.length; i++) {
        var worker = this.workers[i];

        var workStatus = {
            _id: worker.id,
            name: worker.name,
            status: worker.running ? 'running': 'stopped',
            isStopped: !worker.running,
            startTime: worker.startTime,
            stopTime: worker.stopTime,
            lastPing: new Date().getTime()
        };

        // Update the hash value for the given dm:workers key
        this.redisManager.set("dm:workers", worker.id, workStatus);

        // If the worker has an available count, use that to report 
        // on the history of the worker's per second update status
        if (typeof worker.processCount == 'number') {
            var current = worker.processCount;
            worker.processCount = 0;

            var now = new Date().getTime();
            var diff = this.reportIntervalMs;
            if (this.lastIntervalUpdate)
                diff = now - this.lastIntervalUpdate;

            var sec = diff / 1000.0;
            var countPerSec = current / sec;

            // Add to a sorted list of history for the given 
            // worker to allow for a graph to be displayed for the 
            // last X seconds of processing for this worker
            // 
            // Since sorted sets in redis are automatic, use the time 
            // as the weight for the given key time:count
            // Then limit this list by getting the card of the set
            // and removing anything after the card
            //
            // History can be derived from the keys and splitting on the ':' 
            // to get the count for that particular epoch
            this.redisManager.zAdd("dm:workers:pps:" + worker.id, now, now.toString() + ":" + countPerSec.toString());
            var minTime = now - (diff * this.ppsZLimit);
            this.redisManager.zRemMinScore("dm:workers:pps:" + worker.id, minTime);
        }
    }
};

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

exports.commands = function (worker, options) {
};
