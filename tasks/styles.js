'use strict';

var less    = require('gulp-less')
  , plumber = require('gulp-plumber')
  ;

module.exports = function(gulp, opts) {
  // Compiles less on to /css
gulp.task('less', ['less-thousand', 'less-map']);
  gulp.task('less-map', function () {
    gulp.src('./client/map/less/**/*.less')
      .pipe(plumber({
          errorHandler: function (err) {
              console.log(err);
              this.emit('end');
          }
      }))
      .pipe(less())
      .pipe(gulp.dest('./client/map/css'));
  });
  
    gulp.task('less-thousand', function () {
    gulp.src('./client/thousand/less/**/*.less')
      .pipe(plumber({
          errorHandler: function (err) {
              console.log(err);
              this.emit('end');
          }
      }))
      .pipe(less())
      .pipe(gulp.dest('./client/thousand/css'));
  });

};