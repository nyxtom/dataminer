
/**
 * Module dependencies.
 */

var events = require('events');
    util = require('util');

var Worker = require('./worker'),
    connectionManager = require('./data').connectionManager;

/**
 * Library version.
 */

exports.version = '0.1.0';

/**
 * Initialize a new Queue worker implementation.
 *
 * @api public
 */

function Queue(queueName, options) {
    Worker.call(this, options);
    this.queueName = queueName;
}

/**
 * Inherit queue to event emitter.
 */

util.inherits(Queue, Worker);
module.exports = Queue;

/**
 * Connects to a redis enabled client using the connection manager.
 *
 * @api public
 */

Queue.prototype.connectRedis = function () {
    var self = this;
    this.redisClient = connectionManager.getRedisClient(this.options);
    this.redisClient.on('error', function (err) {
        self.emit('error', err);
    });
    this.redisClient.on('ready', function () {
        self.emit('ready');
    });
    this.count = 0;
};

/**
 * Processes from the queue via redis.
 *
 * @api public
 */

Queue.prototype.processQueue = function (fn) {
    var self = this;

    if (!this.running) return;

    this.redisClient.blpop(this.queueName, 0, function (err, doc) {
        if (err) {
            self.emit('error', err);
        }
        else if (doc && doc.length > 1) {
            fn(doc[1]);
            self.count++;
        }
        
        self.processQueue();
    });
};

/**
 * Executes the main functionality of the queue.
 *
 * @api public
 */

QueueWorker.prototype._execute = QueueWorker.prototype.execute;
QueueWorker.prototype.execute = function () {
    var self = this;
    this.on('ready', function () {
        self.report();
        self.processQueue();
    });
    this.connectRedis();
    this._execute();
}
