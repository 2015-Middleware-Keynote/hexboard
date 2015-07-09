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
  , data: process.cwd() + '/data'
  }
, lrPort: 35729
, frontend: {
    hostname: 'localhost'
  , port: process.env.PORT || '9000'
  }
, backend: {
    ws: process.env.WS_HOST || 'ws://localhost:9000'
  }
};

process.env.PORT = opts.frontend.port;

module.exports = function(gulp, baseOpts) {
  var newOpts = _.extend({}, baseOpts, opts);
  return newOpts;
};
