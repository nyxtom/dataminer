
/**
 * Module dependencies
 */

var mongo = require('mongojs'),
    util = require('util'),
    events = require('events');

/**
 * Local modules and configuration tools.
 */

var connectionManager = require('./data').connectionManager;
    log = require('./log');

/**
 * Export version
 */

exports.version = '0.1.0';

/**
 * Worker implementation returns a tracable worker 
 * that can be monitored, started/stopped and controlled 
 * for processing in parallel or basic reporting.
 *
 * @returns {Worker}
 * @api public
 */

function Worker(options) {
    events.EventEmitter.call(this);
    this.options = options || {};
    this.config = {};
    this.running = true;
    this.name = function () { return ''; };
    this.id = function () { return ''; };
    this.workerRepo = null;
    this.reportInterval = null;
    this.startTime = 0;
}

/**
 * Inherit worker to event emitter.
 */

util.inherits(Worker, events.EventEmitter);
module.exports = Worker;

/**
 * Reports the active worker to the database.
 *
 * @api public
 * @emits {'ping'}
 */

Worker.prototype.ping = function () {
    var workerInfo = {
        _id: this.id(),
        Name: this.name(),
        Status: this.running ? 'Running': 'Stopped',
        IsStopped: !this.running,
        StartTimeMs: this.startTime,
        StopTimeMs: this.running ? 0 : new Date().getTime(),
        LastPingMs: new Date().getTime()
    };
    try {
        if (!this.workerRepo)
            this.workerRepo = connectionManager.getMongoClient('workers');

        this.workerRepo.workers.save(workerInfo);

        this.emit('ping');
    }
    catch (err) {
        log("ERROR", err);
    }
};

/**
 * Loads the configuration for the worker from the configs repo.
 *
 * @api public
 */

Worker.prototype.loadConfiguration = function () {
    var self = this;
    var db = connectionManager.getMongoClient('configs', this.options);
    db.configs.findOne({"_id", this.id()}, function (err, doc) {
        self.bindConfiguration(doc);
    });
};

/**
 * Saves the existing configuration back to the configs collection.
 *
 * @api public
 */

Worker.prototype.saveConfiguration = function () {
    var db = connectionManager.getMongoClient('configs', this.options);
    db.configs.save(this.config);
};

/**
 * Binds the configuration values.
 *
 * @api public
 * @emits {'configLoaded'}
 */

Worker.prototype.bindConfiguration = function (config) {
    this.config = config;
    var configured = config && this.validateConfiguration(config);

    if (!configured) {
        this.config = {};
        this.config._id = this.id();
        this.config.Name = this.name();
        this.config = this.configure(this.config);
        this.saveConfiguration();
    }

    this.emit('configLoaded');
};

/**
 * Runs this instance.
 *
 * @param {true|false} configureOnly
 * @api public
 */

Worker.prototype.run = function (configureOnly) {
    var self = this;
    process.on('SIGINT', function () { self.shutdown(); });
    process.on('SIGTERM', function () { self.shutdown(); });
    this.on('configLoaded', function () {
        if (!configureOnly) {
            this.startTime = new Date().getTime();
            this.ping();
            this.report();
            this.execute();
            console.log(this.id() + "/" + this.name() + " running");
        }
    });

    this.loadConfiguration();
};


/**
 * Clean shutdown method.
 *
 * @api public
 * @emits {'shutdown'}
 */

Worker.prototype.shutdown = function () {
    this.running = false;
    clearInterval(this.reportInterval);
    this.ping();
    this.emit('shutdown');
    process.exit();
};

/**
 * Worker reporting loop. Executes report pings 
 * every 60 seconds until report interval is cleared.
 *
 * @api public
 */

Worker.prototype.report = function () {
    var self = this;
    this.reportInterval = setInterval(function () { self.ping(); }, 60000);
    this.ping();
};

/**
 * Configures the completion of the given config object.
 *
 * @abstract
 * @api public 
 */

Worker.prototype.configure = function (config) { return config; };

/**
 * Validates the configuration object.
 *
 * @abstract
 * @api public 
 */

Worker.prototype.validateConfiguration = function (config) { return true; }

/**
 * Completes the process by executing the worker.
 *
 * @abstract
 * @api public
 */

Worker.prototype.execute = function () { };
