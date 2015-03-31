'use strict';

var d3demo = d3demo || {};

d3demo.playback = (function dataSimulator(d3, Rx) {
  var START_MINUTES = 7*60 + 50
    , END_MINUTES = 18*60;

  // var EVENT_DATE = new Date('2015-06-23').getTime() + 7 * 60 * 60 * 1000;
  var EVENT_DATE = new Date('2015-03-11').getTime();

  var scans = Rx.DOM.fromWebSocket(d3demo.config.backend.ws)
  .map(function(json) {
    return JSON.parse(json.data);
  }).filter(function(data) {
    return data.type === 'scan';
  }).map(function(data) {
    return data.data;
  })
  .share();

  var pauser = new Rx.Subject();
  var minutes = START_MINUTES;
  var counter = Rx.Observable.interval(50)  // determines the playback rate
    .map(function(n) {
      return {
        n: n
      , minutes: minutes++ // increment in 1 minute increments
      , timestamp: EVENT_DATE + minutes * 60 * 1000 // timestamp in ms
      }
    })
    .takeWhile(function(tick) {
      return tick.minutes <= END_MINUTES;
  }).pausable(pauser).publish();

  var clock = counter.filter(function(tick) { // reduce the counter to 5 minute increments
    return tick.timestamp % 300000 === 0;
  });

  var bufferMinutes;
  var bufferProgress = scans.flatMap(function(scan) {
    var minutes = Math.floor((scan.timestamp - EVENT_DATE) / 60000.0);
    !bufferMinutes && (bufferMinutes = minutes);
    if (minutes === bufferMinutes) {
      return Rx.Observable.empty(); // don't trigger on same minute
    } else {
      var gap = minutes - bufferMinutes;
      var sequence = gap === 1 ? [minutes] : Rx.Observable.range(bufferMinutes + 1, gap); // trigger on empty minutes
      bufferMinutes = minutes;
      return sequence;
    }
  }).share();

  var bufferedScans = scans.buffer(bufferProgress);

  var timedScans = Rx.Observable.zip(counter, bufferedScans, function(tick, scans) {
    return scans;
  }).flatMap(function(scans) {
    return scans;
  });

  var init = function() {
    bufferMinutes = null;
    minutes = START_MINUTES;
    counter.connect();
    pauser.onNext(false);
  };

  var pause = function() {
    pauser.onNext(false);
  }

  var resume = function() {
    pauser.onNext(true);
  }

  var step = function() {
    pauser.onNext(true);
    counter.take(1).subscribe(function() {
      pauser.onNext(false);
    });
  }

  return {
    eventTimeStamp: EVENT_DATE + START_MINUTES * 60 * 1000
  , START_MINUTES: START_MINUTES
  , END_MINUTES: END_MINUTES
  , init: init
  , pause: pause
  , resume: resume
  , step: step
  , clockProgress: clock
  , bufferProgress: bufferProgress
  , scans: timedScans
  }
})(d3, Rx);
