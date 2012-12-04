
/**
 * Module dependencies
 */

var redis = require('../../redis');

exports.configure = function (app, options) {

    /**
     * Returns a list of all the workers.
     */

    app.get('/api/v1/workers', function (req, res) {
        var redisManager = new redis.Manager(options);
        redisManager.on('ready', function () {
            redisManager.hVals("dm:workers", function (err, docs) {
                if (err) {
                    res.writeHead(500, {'Content-Type':'application/json'});
                    res.write(JSON.stringify(err));
                    res.end();
                }
                else {
                    res.writeHead(200, {'Content-Type':'application/json'});
                    var results = [];
                    for (var i = 0; i < docs.length; i++) {
                        results.push(JSON.parse(docs[i]));
                    }
                    var result = { Result: results, StatusCode: 200, Message: 'OK' };
                    res.write(JSON.stringify(result));
                    res.end();
                }
                redisManager.quit();
            });
        });
        redisManager.connect();
    });

    /**
     * Returns a list of all the active jobs.
     */

    app.get('/api/v1/jobs', function (req, res) {
        var redisManager = new redis.Manager(options);
        redisManager.on('ready', function () {
            redisManager.hVals("dm:jobs", function (err, docs) {
                if (err) {
                    res.writeHead(500, {'Content-Type':'application/json'});
                    res.write(JSON.stringify(err));
                    res.end();
                }
                else {
                    res.writeHead(200, {'Content-Type':'application/json'});
                    var results = [];
                    for (var i = 0; i < docs.length; i++) {
                        results.push(JSON.parse(docs[i]));
                    }
                    var result = { Result: results, StatusCode: 200, Message: 'OK' };
                    res.write(JSON.stringify(result));
                    res.end();
                }
                redisManager.quit();
            });
        });
        redisManager.connect();
    });

};
