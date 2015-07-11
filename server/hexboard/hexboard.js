'use strict';

var Rx = require('rx')
  , _ = require('underscore')
  ;

var HexBoard = function() {

  var hexagons = _.range(1026).map(function(index) {
    return {
      id: index,
      pod: null,
      sketch: []
    };
  });

  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  var clear = function() {
    hexagons.forEach(function(hexagon) {
      hexagon.sketch = [];
    })
  };

  var assignPod = function(parsed) {
    var hexagon = hexagons[parsed.data.id];
    var pod = parsed.data;
    hexagon.pod = pod;
  };

  var dropPod = function(parsed) {
    console.log(parsed);
    var pod = parsed.data;
    var hexagon = hexagons[pod.id];
    delete hexagon.pod;
  };

  var getUnclaimedHexagons = function(list) {
    var minClaimed = 0;
    var filtered = [];
    while(list.length && ! filtered.length) {
      minClaimed++;
      filtered = list.filter(function(hexagon) {
        return hexagon.sketch.length < minClaimed;
      })
    }
    return filtered;
  }

  var claimHexagon = function(sketch) {
    var available = getUnclaimedHexagons(hexagons);
    // prioritize hexagons with pods
    var groups = _.groupBy(available, function(hexagon) {
      return hexagon.pod ? 'yesPod' : 'noPod';
    });
    var available = groups.yesPod && groups.yesPod.length > 0 ? groups.yesPod : groups.noPod;
    var index = getRandomInt(0, available.length);
    var hexagon = available[index];
    sketch.containerId = hexagon.id;
    sketch.pod = hexagon.pod;
    hexagon.sketch.push(sketch);
    return sketch;
  }

  var unclaimHexagon = function(hexagonId) {
    delete hexagons[hexagonId].sketch.pop();
  }

  var currentSketches = function() {
    return hexagons.filter(function(hexagon) {
      return hexagon.sketch.length > 0;
    }).map(function(hexagon) {
      return hexagon.sketch[hexagon.sketch.length - 1];
    });
  }

  return {
    clear: clear
  , claimHexagon: claimHexagon
  , unclaimHexagon: unclaimHexagon
  , assignPod: assignPod
  , dropPod: dropPod
  , currentSketches: currentSketches
  }
}

module.exports = new HexBoard();
