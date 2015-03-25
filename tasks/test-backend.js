'use strict';

var mocha = require('gulp-mocha')
  ;

module.exports = function(gulp, opts) {
  gulp.task('test-backend', function () {
      return gulp.src(opts.paths.server.specs, {read: false})
        .pipe(mocha({reporter: 'spec'}));
  });
};
