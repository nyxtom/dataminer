
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
 * @api public
 */

exports.download = function (path, url, n, job) {
    request.head(url, function (error, r, body) {
        var contentLength = 0;
        if (r && r.headers) {
            // Accept-Ranges Accepted, download multipart
            contentLength = parseInt(r.headers['content-length']);
            if (r.headers['accept-ranges'] == 'bytes') {
                console.log(contentLength);
                if (contentLength <= (1024 * 1024)) {
                    exports._downloadRequest(path, contentLength, {}, url, job);
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

                        exports._downloadRequest(path, contentLength, headers, url, job, bytesParam);
                    }
                }
            }
            else {
                exports._downloadRequest(path, contentLength, {}, url, job);
            }
        }
    });
};

/**
 * Downloads the given part of the request.
 *
 * @api private
 */

exports._downloadRequest = function (path, contentLength, headers, url, job, byteRange) {
    console.log('Downloading part of ' + url);
    console.log(headers);

    // Create a new request for the given url and headers
    fs.open(path, "w+", function (err, fd) {
        var r = request({ method: 'GET', uri: url, headers: headers });
        r.context = {};
        r.context.byteRange = byteRange || { start: 0, end: contentLength };
        r.context.offset = byteRange.start;
        r.context.headers = headers;
        r.context.path = path;
        r.context.contentLength = contentLength;

        r.on('error', function (err) {
            console.log(err);
        });
        r.on('data', function (chunk) {
            if (job) {
                job.progress(chunk.length, contentLength, false, "active");
            }
            fs.write(fd, chunk, 0, chunk.length, r.context.offset);
            r.context.offset += chunk.length;
        });
        r.on('end', function () {
            if (job) {
                job.progress(0, contentLength, true, "done");
            }
            fs.close(fd);
        });
    });
};
