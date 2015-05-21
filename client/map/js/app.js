'use strict';

var d3demo = d3demo || {};

(function d3andRxDemo(d3, Rx) {
  var run = function() {
    Rx.Observable.forkJoin(
      d3demo.layout.initLocations
    ).tapOnCompleted(function() {
      d3demo.forcemap.init();

      switch (d3demo.datafeed) {
        case 'live':
          d3demo.visualisation.live();
          break;
        case 'playback':
          d3demo.visualisation.playback();
          break;
        case 'random':
        default:
          d3demo.visualisation.random();
      }
    })
    .subscribeOnError(function(err) {
      console.log(err.stack || err);
    });
  };

  run();
})(d3, Rx);
