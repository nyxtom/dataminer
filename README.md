### Dataminer
Dataminer is a data mining, fault-tolerant distributed worker queue built
for creating job workers simple and quickly. Common routines for processing queues, streaming data into other queues or distributing queues, flush routines into other data sources are all apart of dataminer's core tasks. Dataminer is backed by [redis](http://redis.io/) and [mongodb](http://mongodb.org/).

```
$ npm install dataminer
```

### Features
--------------------
* fault-tolerant queues
* worker monitoring
* queue events and progress
* worker specific logging
* powered by Redis & MongoDB
* restful json api
* fault tolerant streams
* exponential and linear backoff

### Creating Workers
---------------------
First to create any standard queue worker that processes items off of a redis queue, use ``dataminer.createQueue``.

### dataminer.createQueue(queueName, n, options):
Create a new queue worker to process on `queueName`. `n` is the number of 
calls that will be done at any given time for each job (`n` = 2 will
process 2 jobs at a time for a single process). `n` defaults to `1`.
`options` are extended properties for the worker that include:

* `name`: A friendly name for a given queue worker (defaults to
  `queueName` provided from parameters.
* `redis`: Redis related options for processing the queue and optionally
  reporting on the status of the worker.
    * `host`: defaults to `localhost`.
    * `port`: defaults to `6379`.
    * `options`: redis options to the redis client.
    * `auth`: optional auth parameters to pass to the redis client.
* `report`: defaults to `true` to report on the status of the worker once
  every `reportInterval` milliseconds.
* `reportIntervalMs`: defaults to `1000`
* `progress`: defaults to `false` to update progress with a traceable job id.

```
var dataminer = require('dataminer'),
    request = require('request');

var downloader = dataminer.createQueue('q-urls');
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
    }):

});
```

### TODO:
------------------
* Add streaming to queue support ala dataminer.createStream
    * Add Twitter Stream Support
    * Add Gnip Activity Stream Support
    * Add Newsgator Feed Stream Support
* Add flush routine support to existing queue workers
    * ```queueWorker.flush(flushIntervalMs, function () { })```
* Add dataminer monitoring support ala dataminer.monitor
    * Can report when a registered worker dies
* Add dataminer worker registration
    * ```dataminer.register(worker, options)```

### LICENSE:
--------------------
(The MIT License)

Copyright (c) 2012 <nyxtom@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
