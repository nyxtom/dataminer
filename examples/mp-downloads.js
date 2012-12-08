
var dataminer = require("./../lib/dataminer");
var time = process.hrtime();

dataminer.download("test.pdf", "http://kindle.s3.amazonaws.com/Kindle_Touch_Users_Guide.pdf", 10);

process.on('exit', function () {
    var diff = process.hrtime(time);
    console.log("benchmark took %d seconds and %d nanoseconds", diff[0], diff[1]);
});
