'use strict';

var less    = require('gulp-less')
  , plumber = require('gulp-plumber')
  ;

module.exports = function(gulp, opts) {
  // Compiles less on to /css
  gulp.task('less', function () {
    gulp.src('./client/less/styles.less')
      .pipe(plumber({
          errorHandler: function (err) {
              console.log(err);
              this.emit('end');
          }
      }))
      .pipe(less())
      .pipe(gulp.dest('./client/css'));
  });
};
