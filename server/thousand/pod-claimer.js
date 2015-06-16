'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , _ = require('underscore')
  , pod = require('./pod')
  ;

var tag = 'PODCLAIMER';


var availablePods = [];

var stream = pod.preStartStream.tap(function(parsed) {
    if (parsed.data.stage === 5) {
      availablePods.push(parsed.data);
    } if (parsed.data.stage === 6) {
      availablePods = availablePods.filter(function(pod) {
        return pod.name !== parsed.data.name
      });
    }
  })
  .replay();

stream.connect();

var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var getUnclaimedPods = function(pods) {
  var minClaimed = 0;
  var filteredPods = [];
  while(pods.length && ! filteredPods.length) {
    minClaimed++;
    filteredPods = pods.filter(function(pod) {
      return ! pod.claimed || pod.claimed < minClaimed;
    })
  }
  return filteredPods;
}

var getRandomPod = Rx.Observable.return(availablePods).map(function(pods) {
  return getUnclaimedPods(availablePods);
})
.map(function(pods) {
  if (pods.length === 0) {
    pods = getUnclaimedPods(podPlaceholders);
  };
  var index = getRandomInt(0, pods.length);
  var pod = pods[index];
  pod.claimed = pod.claimed ? pod.claimed + 1 : 1;
  return pod;
});

var podPlaceholders = _.range(1026).map(function(index) {
  return {
    id: index,
    claimed: 0,
    url: null
  };
});

module.exports = {
  getRandomPod: getRandomPod
};
