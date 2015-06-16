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
  ;

var tag = 'PODLOGGER';
var logDir = process.env.LOG_DIR || os.tmpdir();
var parsedStream = fs.createWriteStream(logDir + '/pods-create-parsed.log');

// pod.liveStream.tap(function(parsed) {
pod.preStartStream.tap(function(parsed) {
  console.log('parsed');
  parsedStream.write(JSON.stringify(parsed) + '\n');
})
.subscribeOnError(function(err) {
  console.log(err.stack || err);
});
