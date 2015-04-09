var gulp = require('gulp');

var opts = {};

var opts = require('./tasks/gulp-config.js')(gulp, {});;

require('./tasks/bower.js')(gulp, opts);
require('./tasks/styles.js')(gulp, opts);
require('./tasks/server.js')(gulp, opts);
require('./tasks/debug.js')(gulp, opts);
require('./tasks/test-backend.js')(gulp, opts);
require('./tasks/watch.js')(gulp, opts);

gulp.task('build', ['config', 'less']);
gulp.task('serve', ['node-start', 'build']);
gulp.task('debug', ['node-inspector', 'build']);

gulp.task('default', ['serve', 'watch-client']);

gulp.task('docker', ['serve', 'config']);
