
/**
 * Module dependencies
 */

var dataminer = require('../lib/dataminer'),
    fs = require('fs'),
    request = require('request'),
    Job = require('../lib/job');

var job = Job.createJob('download-urls', {});
for (var i = 0; i < 10; i++) {
    job.queue({'url': 'http://example.com', 'path': 'example.com.txt'});
}

var downloader = dataminer.createQueue('download-urls', { progress: true });
downloader.process(function (job, data, done) {

    var contentLength = 0;
    var req = request(data.url);
    req.pipe(fs.createWriteStream(data.path));
    req.on('response', function (response) {
        if (response.headers['content-length'])
            contentLength = response.headers['content-length'];
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
