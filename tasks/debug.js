'use strict';

var spawn = require('child_process').spawn;
var gutil = require('gulp-util');

module.exports = function(gulp, opts) {
  gulp.task('node-inspector', function() {
    var child = spawn('./node_modules/node-inspector/bin/node-debug.js'
                    , [ './server/server.js'
                      , '--no-preload'
                      , '--debug-port=5857'
                      , '--web-port='+(parseInt(opts.frontend.port)+1)
                      , '--debug-brk=false'
                      ]
                    , {cwd: process.cwd()})
      , stdout = ''
      , stderr = '';

    child.stdout.setEncoding('utf8');

    child.stdout.on('data', function (data) {
        stdout += data;
        gutil.log(data);
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('error', function (data) {
        stderr += data;
        gutil.log(gutil.colors.red(data));
        gutil.beep();
    });

    child.on('close', function(code) {
        gutil.log('Done with exit code', code);
        gutil.log('You access complete stdout and stderr from here'); // stdout, stderr
    });
  });
};
