
/**
 * Module dependencies
 */

var events = require('events'),
    util = require('util'),
    redis = require('redis'),
    check = require('validation').check;

/**
 * Initializes a new manager with the given default redis options.
 *
 * @param {Object} options
 * @api public
 */

function Manager(options) {
    events.EventEmitter.call(this);
    this.options = options || {};
};

/**
 * Inherit manager to EventEmitter.
 */

util.inherits(Manager, events.EventEmitter);

/**
 * Expose Manager
 */

exports.Manager = Manager;

/**
 * Creates the default redis client using the 
 * manager's default or specified options.
 *
 * @return {RedisClient}
 * @api public
 */

Manager.prototype.createClient = function () {
    var self = this;
    var host = this.options.host || 'localhost';
    var port = this.options.port || 6379;
    var options = this.options.options || {};
    check(port).isInt();

    var client = new redis.createClient(host, port, options);
    if (typeof options.auth == 'string') {
        client.auth(options.auth);
    }
    client.on('error', function (err) {
        self.emit('error', err);
    });
    client.on('ready', function () {
        self.emit('ready');
    });
    client.on('end', function () {
        self.emit('end');
    });
    return client;
};

/**
 * Safely calls connect to the redis client.
 *
 * @api public
 */

Manager.prototype.connect = function () {
    try {
        this.client = this.createClient();
    }
    catch (err) {
        self.emit('error', err);
    }
};

/**
 * Backoff method for reconnecting to redis. 
 *
 * @param {String} method: immediate|linear
 * @api public
 */

Manager.prototype.backoffConnect = function (method) {
    var self = this;
    if (typeof method == 'undefined') {
        method = 'immediate';
    }

    if (method == 'linear') {
        setTimeout(function () { self.connect(); }, 1000);
    }
    else {
        this.connect();
    }
};

/**
 * Safely quits the client.
 *
 * @api public
 */

Manager.prototype.quit = function () {
    if (this.client && typeof this.client.quit == 'function') {
        this.client.quit();
    }
};
