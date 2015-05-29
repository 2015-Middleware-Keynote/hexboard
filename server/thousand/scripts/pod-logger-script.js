'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , pod = require('../pod')
  , request = require('request')
  , fs = require('fs')
  ;

var tag = 'PODLOGGER';
var rawStream    = fs.createWriteStream('./server/thousand/pods-create-raw.log');
var parsedStream = fs.createWriteStream('./server/thousand/pods-create-parsed.log');

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
