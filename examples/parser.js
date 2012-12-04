
/**
 * Module dependencies
 */

var dataminer = require('../lib/dataminer'),
    Job = require('../lib/job'),
    execfile = require('./execFile');

// use json_sans_eval.js as a test case
execfile(__dirname + '/json_sans_eval.js', this);

var job = Job.createJob('sample-parser', {});
job.queue({'content': '{ \"id\": \"ksdfjsdkac\", \"text\": \"test tweet text\" }'});

var self = this;
var sampleParser = dataminer.createQueue('sample-parser');
dataminer.register(sampleParser, "dksfdsakfj323000");
sampleParser.process(function (data, done) {

    var json = self.jsonParse(data.content);
    console.log(json);
    done();

});
