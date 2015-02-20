var gulp = require('gulp');

var opts = {};

require('./tasks/connect.js')(gulp, opts);

gulp.task('default', ['less', 'connect', 'watch']);
