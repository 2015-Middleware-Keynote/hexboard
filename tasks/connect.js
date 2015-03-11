'use strict';

var connect = require('gulp-connect')
  , open    = require('open')
  , less    = require('gulp-less')
  , plumber = require('gulp-plumber')
  ;

module.exports = function(gulp, opts) {
  gulp.task('connect', function() {
    connect.server({
      root: 'client',
      livereload: true
    });
    open('http://localhost:8080');
  });

  gulp.task('html', function () {
    gulp.src('./client/**/*.html')
      .pipe(connect.reload());
  });

  gulp.task('js', function () {
    gulp.src('./client/**/*.js')
      .pipe(connect.reload());
  });

  gulp.task('css', function () {
    gulp.src('./client/**/*.css')
      .pipe(connect.reload());
  });

  // Compiles less on to /css
  gulp.task('less', function () {
    gulp.src('./client/less/**/*.less')
      .pipe(plumber({
          errorHandler: function (err) {
              console.log(err);
              this.emit('end');
          }
      }))
      .pipe(less())
      .pipe(gulp.dest('./client/css'));
  });

  gulp.task('watch', function () {
    gulp.watch(['./client/less/**/*.less'], ['less']);
    gulp.watch(['./client/**/*.html'], ['html']);
    gulp.watch(['./client/**/*.js'], ['js']);
    gulp.watch(['./client/**/*.css'], ['css']);
  });
};
