
/**
 * Module dependencies
 */

var kue = require('kue'),
    express = require('express');

/**
 * Configuration variables
 */

var config = require('../config');

/**
 * Start the app server to allow for jobs to be visible
 */

function main() {
    kue.app.use(express.basicAuth(config.username, config.password));
    kue.app.listen(config.port);
    console.log('listening on port ' + config.port);
}

main();
