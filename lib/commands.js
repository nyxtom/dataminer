
/**
 * Module dependencies
 */

var dataminer = require('./dataminer'),
    events = require('events'),
    util = require('util');

/**
 * Creates a new instance of the worker commands.
 *
 * @param {Object} options
 * @api public
 */

function CommandsWorker(options) {
    events.EventEmitter.call(this);
    this.options = options || {};
    this.options.progress = false;
    this.worker = dataminer.createQueue('dm:workers:commands', 1, this.options);
    dataminer.register(this.worker, '__dm_cmds_be8e8abf47b0');
};

/**
 * Inherit commands worker to events EventEmitter
 */

util.inherits(CommandsWorker, events.EventEmitter);
exports.CommandsWorker = CommandsWorker;

/**
 * Begins the process of handling the commands.
 *
 * @api public
 */

exports.process = function () {
    var self = this;
    this.worker.process(function (data, done) {
        if (data.worker && data.cmd) {
            self.emit('cmd', data);
        }

        done();
    });
};
