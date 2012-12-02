
/**
 * Module dependencies
 */

var kue = require('kue'),
    http = require('http');

/**
 * Local variables
 */

var jobs = kue.createQueue();

function createDownloads(url, path) {
    jobs.create('dataminer:downloads', {
        title: 'Downloading ' + url + ' to ' + path,
        downloadUrl: url,
        fileName: path
    }).save();
}

createDownloads('http://example.com', 'download-example.com.txt');
