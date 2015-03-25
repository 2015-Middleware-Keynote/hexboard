'use strict';

var _ = require('underscore')
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
};

process.env.PORT = opts.frontend.port;

module.exports = function(gulp, baseOpts) {
  var newOpts = _.extend({}, baseOpts, opts);
  return newOpts;
};
