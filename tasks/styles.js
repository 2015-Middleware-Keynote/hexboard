'use strict';

var less    = require('gulp-less')
  , sass    = require('gulp-sass')
  , plumber = require('gulp-plumber')
  , minifyCss = require('gulp-minify-css')
  , rename = require('gulp-rename')
  ;

module.exports = function(gulp, opts) {
  // Compiles less on to /css
  gulp.task('less', function () {
    gulp.src('./static/less/styles.less')
      .pipe(plumber({
          errorHandler: function (err) {
              console.log(err);
              this.emit('end');
          }
      }))
      .pipe(less())
      .pipe(gulp.dest('./static/css'));
  });

  gulp.task('sass', function(done) {
    gulp.src('./static/mobile/scss/ionic.app.scss')
      .pipe(sass({
        errLogToConsole: true
      }))
      .pipe(gulp.dest('./static/mobile/css/'))
      .pipe(minifyCss({
        keepSpecialComments: 0
      }))
      .pipe(rename({ extname: '.min.css' }))
      .pipe(gulp.dest('./static/mobile/css/'))
      .on('end', done);
  });
};
