'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , pod = require('../pod')
  , request = require('request')
  , fs = require('fs')
  , os = require('os')
  ;

var tag = 'PODLOGGER';
var logDir = process.env.LOG_DIR || os.tmpdir();
var rawStream    = fs.createWriteStream(logDir + '/pods-create-raw.log');
var parsedStream = fs.createWriteStream(logDir + '/pods-create-parsed.log');

pod.rawStream.tap(function(raw) {
  console.log('raw');
  rawStream.write(JSON.stringify(raw) + '\n');
})
.subscribeOnError(function(err) {
  console.log(err.stack || err);
})

pod.eventStream.tap(function(parsed) {
  console.log('parsed');
  parsedStream.write(JSON.stringify(parsed) + '\n');
})
.subscribeOnError(function(err) {
  console.log(err.stack || err);
});
