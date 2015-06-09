'use strict';

var env = require('node-env-file');

var secretEnvFile = process.env.HOME + '/demo2015-ui.env';
secretEnvFile && env(secretEnvFile);

var Rx = require('rx')
  , RxNode = require('rx-node')
  , pod = require('../pod')
  , request = require('request')
  , fs = require('fs')
  , os = require('os')
  , through2 = require('through2')
  , split = require('split')
  , filter = require('stream-filter')
  ;

var tag = 'PODPARSER';
var logDir = process.env.LOG_DIR || os.tmpdir();
var rawStream    = fs.createReadStream(logDir + '/pods-create-raw.log');
var parsedStream = fs.createWriteStream(logDir + '/pods-create-parsed.log');

rawStream
  .pipe(split())
  .pipe(filter(function(line) {
      return line.length;
    }))
  .pipe(filter(function(line) {
    return line != 'undefined';
  }))
  .pipe(through2.obj(function (line, enc, callback) {
    var json = JSON.parse(line)
    var parsed = pod.parseData(json);
    this.push(parsed);
    callback();
  }))
  .pipe(filter(function(parsed) {
    return parsed && parsed.data && parsed.data.type;
  }))
  .pipe(through2.obj(function (parsed, enc, callback) {
    this.push(JSON.stringify(parsed) + '\n');
    console.log('write');
    callback();
  }))
  .pipe(parsedStream);
;

rawStream.on('end', function() {
  console.log('end');
})
