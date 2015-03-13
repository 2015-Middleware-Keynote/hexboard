'use strict';

var d3demo = d3demo || {};

d3demo.controls = (function controls(d3, Rx) {
  var pause = Rx.Observable.fromEvent(d3.select('#pause').node(), 'click')
    , play = Rx.Observable.fromEvent(d3.select('#play').node(), 'click')
    , step = Rx.Observable.fromEvent(d3.select('#step').node(), 'click')
    ;

  play.subscribe(function() {
    d3demo.playback.resume();
  });

  step.subscribe(function() {
    d3demo.playback.pause();
    d3demo.playback.step();
  })

  pause.subscribe(function() {
    d3demo.playback.pause();
  });

  return {

  }
})(d3, Rx);
