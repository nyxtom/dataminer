
/**
 * Module dependencies
 */

var dataminer = require('../lib/dataminer'),
    Job = require('../lib/job');

var job = Job.createJob('download-urls', {});
job.queue({'content': '{ \"id\": \"ksdfjsdkac\", \"text\": \"test tweet text\" }'});

var sampleParser = dataminer.createQueue('sample-parser');
dataminer.register(sampleParser, "dksfdsakfj323000");
sampleParser.process(function (data, done) {

    var json = JSON.parse(data.content);
    console.log(json);
    done();

});
