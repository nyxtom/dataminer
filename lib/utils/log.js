
/**
 * Module dependencies
 */

var mongo = require('mongojs'),
    config = require('./../../config'),
    connectionManager = require('./data').connectionManager;

/**
 * Logs the specified message to the database.
 */

module.exports = function log(level, message) {
    var data = {
        'timestamp': new Date(),
        'level': level,
        'message': message
    };

    if (level == 'ERROR')
        data.exception = {
            'message': message,
            'stackTrace': (new Error().stack)
        };

    var db = connectionManager.getMongoClient('log');
    db.log.insert(data);
};
