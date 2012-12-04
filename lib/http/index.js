
/**
 * Module dependencies
 */

var express = require('express'),
    fs = require('fs');


/**
 * Default express app.
 */

var app = express();
exports.app = app;

/**
 * Configure server
 */

app.configure(function () {
    app.use(express.bodyParser());
    app.set("view engine", "ejs");
    app.engine("html", require("ejs").renderFile);
    app.use(app.router);
    app.use(express.static(__dirname + "/public"));
});

app.configure("development", function () {
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure("production", function () {
    app.use(express.errorHandler());
});

/**
 * Configures the application with the given options.
 *
 * @param {Object} options
 * @api private
 */

function configure (options) {
    fs.readdir(__dirname + "/routes/", function (err, files) {
        if (err) throw err;
        files.forEach(function (file) {
            require(__dirname + "/routes/" + file).configure(app, options);
        });
    });
};

/**
 * Starts the server using the default options.
 *
 * @api public
 */

exports.listen = function (options, port, fn) {
    configure(options || {});
    app.listen(port || process.env.PORT || 3000, fn || function () {
        console.log('dataminer web listening on port %d in %s mode', this.address().port, app.settings.env);
    });
};
