'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , _ = require('underscore')
  , pod = require('./pod')
  ;

var tag = 'PODCLAIMER';


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

var getRandomPod = pod.preStartStream.filter(function(parsed) {
    // console.log(parsed.data.stage);
    return parsed.data.stage == 5;
  })
  .buffer(pod.preStartStream.debounce(15))
  .take(1)
  .map(function(pods) {
    return getUnclaimedPods(pods);
  })
  .map(function(pods) {
    console.log(tag, 'unclaimed pods', pods.length);
    if (pods.length === 0) {
      console.log(tag, 'No pods available for claiming, using placeholders');
      pods = getUnclaimedPods(podPlaceholders);
    };
    var index = getRandomInt(0, pods.length);
    var pod = pods[index];
    pod.claimed = pod.claimed ? pod.claimed + 1 : 1;
    return pod.data;
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
