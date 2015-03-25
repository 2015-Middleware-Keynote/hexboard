'use strict';

var _ = require('underscore')
  , template = require('gulp-template')
  , rename = require("gulp-rename")
  ;

var opts = {
  paths: {
    server: {
      specs: 'server/**/*.spec.js'
    }
  }
, lrPort: 35729
, frontend: {
    hostname: 'localhost'
  , port: '8080'
  }
, backend: {
    ws: process.env.NODE_ENV === 'production'
        ? process.env.OPENSHIFT_NODEJS_IP
          ? 'ws://beaconlocation-bleathemredhat.rhcloud.com:8000'
          : 'ws://ec2.bleathem.ca:8080'
        : 'ws://localhost:8080'
  }
};

process.env.PORT = opts.frontend.port;

module.exports = function(gulp, baseOpts) {
  gulp.task('config', function () {
    return gulp.src('client/js/config.tpl.js')
        .pipe(template({backend_ws: opts.backend.ws}))
        .pipe(rename('config.js'))
        .pipe(gulp.dest('client/js'));
  });
  var newOpts = _.extend({}, baseOpts, opts);
  return newOpts;
};
