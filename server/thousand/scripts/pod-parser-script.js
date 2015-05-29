

'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , pod = require('../pod')
  , request = require('request')
  , fs = require('fs')
  , through2 = require('through2')
  , split = require('split')
  , filter = require('stream-filter')
  ;

var tag = 'PODPARSER';
var rawStream    = fs.createReadStream('./server/thousand/pods-create-raw.log');
var parsedStream = fs.createWriteStream('./server/thousand/pods-create-parsed.log');

rawStream
  .pipe(split())
  .pipe(filter(function(line) {
      return line.length;
    }))
  .pipe(through2.obj(function (line, enc, callback) {
    var json = JSON.parse(line)
    var parsed = pod.parseData(json);
    this.push(parsed);
    callback();
  }))
  .pipe(filter(function(parsed) {
    return parsed && parsed.data && parsed.data.stage;
  }))
  .pipe(through2.obj(function (parsed, enc, callback) {
    this.push(JSON.stringify(parsed) + '\n');
    callback();
  }))
  .pipe(parsedStream);
;
