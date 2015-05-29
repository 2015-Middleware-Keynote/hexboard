

'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , pod = require('../pod')
  ;

pod.getActivePreStartPods.tap(function(item) {
  console.log(item);
}).subscribeOnError(function(err) {
  console.log(err.stack || err);
});

// pod.getFromPod('sketch-1-pod-1-vppn7');
// pod.getFromPod('sketch-966-pod-1-uas1q');
