'use strict';

var d3demo = d3demo || {};

(function d3andRxDemo(d3, Rx) {
  var run = function(clock, source, bufferProgress) {
    d3demo.playback.init();
    d3demo.visualisation.init();

    d3demo.visualisation.start();
  };

  run();
})(d3, Rx);
