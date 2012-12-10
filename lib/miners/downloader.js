
/**
 * Module dependencies
 */

var dataminer = require('../dataminer'),
    request = require('request'),
    fs = require('fs');

/**
 * Uses content-range headers (where available) to 
 * determine whether to parallelize the download.
 *
 * @param {String} path: download path to store the download
 * @param {String} url: the url to download
 * @param {Number} n: number of multi-part requests to perform
 * @param {Function} done: callback when the download completes
 * @api public
 */

exports.download = function (path, url, n, job, done) {
    request.head(url, function (error, r, body) {
        var contentLength = 0;
        if (r && r.headers) {
            // Accept-Ranges Accepted, download multipart
            contentLength = parseInt(r.headers['content-length']);

            // Initialize a new download context
            var context = {};
            context.path = path;
            context.contentLength = contentLength;
            context.url = url;
            context.bytesComplete = 0;
            context.job = job;

            if (r.headers['accept-ranges'] == 'bytes') {
                console.log(contentLength);
                if (contentLength <= (1024 * 1024)) {
                    exports._downloadRequest(context, {}, {}, done);
                }
                else {
                    var bytesPerRequest = contentLength / n;
                    while (n-- > 0) {
                        var bytesParam = { 
                            'start': n * bytesPerRequest, 
                            'end': (n + 1) * bytesPerRequest
                        };
                        if (bytesParam.end > contentLength) {
                            bytesParam.end = contentLength;
                        }

                        var headers = {};
                        headers.Range = "bytes=" + bytesParam.start + "-";
                        if (bytesParam.end < contentLength)
                            headers.Range += bytesParam.end;

                        exports._downloadRequest(context, headers, bytesParam, done);
                    }
                }
            }
            else {
                exports._downloadRequest(context, {}, {}, done);
            }
        }
    });
};

/**
 * Downloads the given part of the request.
 *
 * @api private
 */

exports._downloadRequest = function (context, headers, byteRange, done) {
    console.log('Downloading part of ' + context.url);
    console.log(headers);

    // Create a new request for the given url and headers
    fs.open(context.path, "w+", function (err, fd) {
        var r = request({ method: 'GET', uri: context.url, headers: headers });
        r.context = {};
        r.context.byteRange = byteRange || { start: 0, end: contentLength };
        r.context.offset = r.context.byteRange.start || 0;

        r.on('error', function (err) {
            if (done)
                done(err);
            else
                console.log(err);
        });
        r.on('data', function (chunk) {
            if (context.job) {
                context.job.progress(chunk.length, context.contentLength, false, "active");
            }
            fs.write(fd, chunk, 0, chunk.length, r.context.offset);
            r.context.offset += chunk.length;
            context.bytesComplete += chunk.length;
        });
        r.on('end', function () {
            if (context.job) {
                context.job.progress(0, context.contentLength, true, "done");
            }
            fs.close(fd);
            if (context.bytesComplete >= context.contentLength) {
                if (done) {
                    done();
                }
                else {
                    console.log('Download of ' + context.url + ' complete');
                }
            }
        });
    });
};
