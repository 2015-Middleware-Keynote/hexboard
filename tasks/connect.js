'use strict';

var connect = require('gulp-connect')
  , open    = require('open')
  , less    = require('gulp-less')
  , plumber = require('gulp-plumber')
  ;

module.exports = function(gulp, opts) {
  gulp.task('connect', function() {
    connect.server({
      root: 'src',
      livereload: true
    });
    open('http://localhost:8080');
  });

  gulp.task('html', function () {
    gulp.src('./src/**/*.html')
      .pipe(connect.reload());
  });

  gulp.task('js', function () {
    gulp.src('./src/**/*.js')
      .pipe(connect.reload());
  });

  gulp.task('css', function () {
    gulp.src('./src/**/*.css')
      .pipe(connect.reload());
  });

  // Compiles less on to /css
  gulp.task('less', function () {
    gulp.src('./src/less/**/*.less')
      .pipe(plumber({
          errorHandler: function (err) {
              console.log(err);
              this.emit('end');
          }
      }))
      .pipe(less())
      .pipe(gulp.dest('./src/css'));
  });

  gulp.task('watch', function () {
    gulp.watch(['./src/less/**/*.less'], ['less']);
    gulp.watch(['./src/**/*.html'], ['html']);
    gulp.watch(['./src/**/*.js'], ['js']);
    gulp.watch(['./src/**/*.css'], ['css']);
  });
};
