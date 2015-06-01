

'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , pod = require('../pod')
  ;

// pod.getActivePreStartPods.tap(function(items) {
//   console.log(items);
// }).subscribeOnError(function(err) {
//   console.log(err.stack || err);
// });

pod.getRandomPod.subscribe(function(randomPod) {
  console.log(randomPod);
})
