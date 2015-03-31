'use strict';

var d3demo = d3demo || {};

(function d3andRxDemo(d3, Rx) {
  var run = function(clock, source, bufferProgress) {
    d3demo.playback.init();
    d3demo.forcemap.init();

    if (d3demo.live) {
      d3demo.visualisation.live();
    } else {
      d3demo.visualisation.playback();
    }

  };

  run();
})(d3, Rx);
