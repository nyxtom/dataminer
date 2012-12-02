
/**
 * Module dependencies
 */

var kue = require('kue'),
    request = require('request'),
    fs = require('fs'),
    events = require('events');

/**
 * Local Variables, Jobs Queue Access and Config
 */

var jobs = kue.createQueue();
var config = require('../config');
var maxParallel = config.maxParallelPerProcess;

/**
 * Library version
 */

exports.version = '0.1.0';

/**
 * Executes the download of the given job with request parameters.
 */

function executeDownload(job, done) {
    // Capture the response to gather the download progress
    var req = request(job.data.downloadUrl);
    var contentLength = 0;
    req.pipe(fs.createWriteStream(job.data.fileName));
    req.on('response', function (response) {
        contentLength = response['content-length'];
    });
    req.on('data', function (chunk) {
        job.progress(chunk.length, contentLength);
    });
    req.on('error', function (err) {
        done(err);
    });
    req.on('end', function (chunk) {
        done();
    });
}

/**
 * Process the download queue using the max degree of parallel downloads.
 */

function main() {
    jobs.process('dataminer:downloads', maxParallel, function (job, done) {
        try {
            if (job && job.data.downloadUrl && job.data.fileName) {
                executeDownload(job, done);
            }
        }
        catch (err) {
            return done(err);
        }
    });
}

/**
 * Initialize by running the main process
 */

main();
