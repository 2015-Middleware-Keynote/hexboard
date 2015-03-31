'use strict';

var nodemon = require('gulp-nodemon')
  , open    = require('open')
  , livereload = require('gulp-livereload')
  , gutil      = require('gulp-util')
  ;

var started = false;

module.exports = function(gulp, opts) {
  gulp.task('serve', function () {
    nodemon({
      script: 'server/server.js',
      ignore: ['**/node_modules/**/*.js'],
      watch: ['server'],
      nodeArgs: ['--debug']
      })
      .on('restart', function () {
        gutil.log('...nodemon restart');
      })
      .on('start', function() {
        if (started) {
          gutil.log('...nodemon start, reloading lr');
          livereload.changed('*', opts.lr);
        } else {
          gutil.log('...nodemon start');
          started = true;
          setTimeout(function() {
              open('http://' + opts.frontend.hostname + ':' + opts.frontend.port);
            }, 500);
        }
      });
  });
};
