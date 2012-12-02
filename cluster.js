var cluster = require('cluster');
    argv = require('optimist').argv;

/* Obtain all the appropriate variables 
 * sent from the arguments and use them 
 * to spawn up whatever is being clustered.
 */
var workers = argv.workers || 1;
var modules = [];
var respawn = argv.respawn || true;
if (!argv._ || argv._.length == 0 || argv.help || argv.h) {
    console.error("Usage: node cluster [options] module module module");
    console.error("    --workers: Specifies the number of processes to fork (default 2)");
    return console.error("    --respawn: Specifies whether to fork a worker when it dies. (default true)");
}
else {
    modules = argv._;
}

/* Format the standard output to include pid data */
console.log = function (data) {
    if (!cluster.isMaster) {
        process.stdout.write("WORKER [" + process.pid + "] - " + data + "\n");
    }
    else {
        process.stdout.write("MASTER [" + process.pid + "] - " + data + "\n");
    }
}

/* Handle auto-respawns when specified */
cluster.on('death', function (worker) {
    if (respawn) {
        console.log("Worker " + worker.pid + " died. restarting...");
        cluster.fork();
    }
    else {
        console.log("Worker " + worker.pid + " died.");
    }
});

/* All imported modules must follow the appropriate process logic */
if (cluster.isMaster) {
    // Fork workers
    for (var i = 0; i < workers; i++) {
        cluster.fork();
    }
}
else {
    for (var i = 0; i < modules.length; ++i) {
        var module = modules[i];
        require('./' + module);
    }
}
