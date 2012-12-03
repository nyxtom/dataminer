
/**
 * Module dependencies
 */

var events = require('events'),
    util = require('util'),
    redis = require('redis'),
    uuid = require('node-uuid'),
    check = require('validator').check;

/**
 * Initializes a new manager with the given default redis options.
 *
 * @param {Object} options
 * @api public
 */

function Manager(options) {
    events.EventEmitter.call(this);
    this.options = options || {};
    this.id = uuid.v1();
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

    var client = new redis.createClient(port, host, options);
    if (typeof options.auth == 'string') {
        client.auth(options.auth);
    }
    client.on('error', function (err) {
        console.log('[' + self.id + '] ' + err);
    });
    client.on('ready', function () {
        console.log('[' + self.id + '] connected to redis!');
        self.emit('ready');
        self.retried = 0;
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
        console.log('[' + this.id + '] connecting to redis...');
        this.client = this.createClient();
    }
    catch (err) {
        self.emit('error', err);
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


/**
 * Adds an item to the sorted set key with the given score.
 *
 * @param {String} key
 * @param {Number} score
 * @param {String} member
 * @api public
 */

Manager.prototype.zAdd = function (key, score, member) {
    this.client.zadd([key,score,member], function (err, response) {});
};

/**
 * Limits the sorted set by the given minimum score value and removes 
 * all times from 0 to minScore.
 *
 * @param {String} key
 * @param {Number} minScore
 * @api public
 */

Manager.prototype.zRemMinScore = function (key, minScore) {
    this.client.zremrangebyscore([key, 0, minScore], function (err, response) {});
};


/**
 * Blocking pop on a list in redis.
 *
 * @param {String} key
 * @param {Function} callback
 * @api public
 */

Manager.prototype.blpop = function (key, callback) {
    this.client.blpop(key, 0, callback);
};

/**
 * Sets the given key and hash member to the object.
 *
 * @param {String} key
 * @param {String} member
 * @param {Object} value
 * @api public
 */

Manager.prototype.set = function (key, member, value) {
    this.client.hset(key, member, JSON.stringify(value), function (err, response) {});
};

/**
 * Pushes the given data to the list key.
 *
 * @param {String} key
 * @param {Object} data
 * @api public
 */

Manager.prototype.rPush = function (type, data) {
    this.client.rpush(type, JSON.stringify(data), function (err, response) {});
};

/**
 * Deletes the key from redis.
 *
 * @param {String} key
 * @api public
 */

Manager.prototype.del = function (key) {
    this.client.del(key, function (err, response) {});
};

/**
 * Deletes the hash field from the key.
 *
 * @param {String} key
 * @param {String} field
 * @api public
 */

Manager.prototype.hDel = function (key, field) {
    this.client.hdel([key, field], function (err, response) {});
};
