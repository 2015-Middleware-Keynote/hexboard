'use strict';

var livereload    = require('gulp-livereload')
  , gutil         = require('gulp-util')
  ;

module.exports = function(gulp, opts) {
  gulp.task('livereload-start', function() {
    opts.watching = true;
    opts.lr = livereload.listen(opts.lrPort, {silent: false, auto:true});
    gutil.log('Livereload tiny-lr started listeining on port:' + opts.lrPort);
  });

  gulp.task('watch-client', ['livereload-start'], function() {
    var scriptSource = 'client/**/*.*';
    gulp.watch(scriptSource, function(event) {
      livereload.changed(event.path, opts.lr);
    });
  })
};
