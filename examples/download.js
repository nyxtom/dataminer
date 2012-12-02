
/**
 * Module dependencies
 */

var dataminer = require('../lib/dataminer'),
    request = require('request');

var downloader = dataminer.createQueue('download-urls');
downloader.process(function (job, done) {

    var contentLength = 0;
    var req = request(job.data.url);
    req.pipe(fs.createWriteStream(job.data.path));
    req.on('response', function (response) {
        contentLength = response['content-length'];
    });
    req.on('data', function (chunk) {
        job.progress(chunk.length, contentLength);
    });
    req.on('error', function (err) {
        done(err);
    });
    req.on('end', function () {
        done();
    });

});
