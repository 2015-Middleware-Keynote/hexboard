'use strict';

var env = require('node-env-file');

var secretEnvFile = process.env.HOME + '/demo2015-ui.env';
secretEnvFile && env(secretEnvFile);

var fs = require('fs')
  , os = require('os')
  , pod = require('../pod')
  , through2 = require('through2')
  , sort = require('sort-stream2')
  , split = require('split')
  , filter = require('stream-filter')
  , mergeStream = require('merge-stream')
  ;

var logDir = process.env.LOG_DIR || os.tmpdir();
var origStream = fs.createReadStream(logDir + '/pods-create-parsed.orig.log');
var parsedStream = fs.createWriteStream(logDir + '/pods-create-parsed.log');

origStream
.pipe(split())
.pipe(filter(function(line) {
    return line.length;
  }))
.pipe(filter(function(line) {
  return line != 'undefined';
}))
.pipe(through2.obj(function (line, enc, callback) {
  var update = JSON.parse(line)
  var newId = pod.podNumber(update.object.metadata.namespace, update.object.metadata.name);
  update.data.id = newId;
  this.push(update);
  callback();
}))
.pipe(through2.obj(function (parsed, enc, callback) {
  this.push(JSON.stringify(parsed) + '\n');
  console.log('write');
  callback();
}))
.pipe(parsedStream);
