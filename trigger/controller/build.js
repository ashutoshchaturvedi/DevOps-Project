var exec = require('child_process').exec;
var dateformat = require('dateformat');
var history = require('./history.js');
var parse = require('./parser.js');
var mailer = require('./mailer.js');

const build_cmd_base = 'sudo docker run -v /home/ubuntu/DevOps-Project/build/:/vol buildserver sh -c /vol/';

// Pre Build Function
function preBuild(build_process, branch) {
    build_process.stdout.write("BUILD: Initializing");
    build_process.stdout.write("BUILD: Branch - " + branch)
}

// Build Function
function onBuild(req, res) {

    // Build
    if (typeof req.query.branch == 'undefined') {
        res.send("Error: Please send a proper GET request!")
    }else{
        var cmd_name = "build_" + req.query.branch +".sh";
        var build_cmd = build_cmd_base + cmd_name;
        var build_process = exec(build_cmd, {maxBuffer: 1024 * 5000}, postBuild);

        preBuild(build_process, req.query.branch);

        // Bind Streams
        build_process.stdout.pipe(res);
        build_process.stderr.pipe(process.stderr);
    }
}

// Post Build Callback
function postBuild(err, stdout, stderr) {
    if (err){
        console.log(err);
    }

    var now = new Date();
    var id = now.getTime();
    var timestamp = dateformat(now);
    var log = stdout;
    var status = parse(log);

    history.addBuild(id, timestamp, log, status, 'develop', function(err){
        if (err)
            console.log(err);
        else{
            console.log("BUILD: Completed - " + timestamp);
            console.log("BUILD: Status - " + status);
            mailer(status, id);
        }
    });

}

module.exports = onBuild;