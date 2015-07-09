'use strict';

var _ = require('underscore')
  , template = require('gulp-template')
  , rename = require('gulp-rename')
  , config = require('../server/config')
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
  , port: config.get('PORT')
  }
};

module.exports = function(gulp, baseOpts) {
  var newOpts = _.extend({}, baseOpts, opts);
  return newOpts;
};
