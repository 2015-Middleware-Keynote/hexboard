var gulp = require('gulp');

var opts = {};

require('./tasks/connect.js')(gulp, opts);
require('./tasks/server.js')(gulp, opts);

gulp.task('default', ['serve', 'less', 'connect', 'watch']);

gulp.task('docker', ['serve', 'less']);
