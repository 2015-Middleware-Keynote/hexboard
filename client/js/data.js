'use strict';

var d3demo = d3demo || {};

d3demo.random = (function dataSimulator(d3, Rx) {
  var START_MINUTES = 7*60 + 50
    , END_MINUTES = 18*60;

  var EVENT_DATE = new Date('2015-06-23').getTime() + 7 * 60 * 60 * 1000;

  var users = [];
  // initialize the users
  for (var i = 0; i < 200; i++) {
    users.push({
      id: i
    , name: i === 13 ? 'Burr Sutter' : 'Firstname' + i + ' Lastname' + i
    });
  };

  var playbackSocket = function(cb) {
    var scans = Rx.DOM.fromWebSocket(
      // 'ws://beaconlocation-bleathemredhat.rhcloud.com:8000'
      'ws://localhost:8000'
    ).map(function(json) {
      return JSON.parse(json.data);
    }).filter(function(data) {
      return data.type === 'scan';
    }).map(function(data) {
      return data.data;
    })
    .share();

    var counter = Rx.Observable.interval(50)  // determines the playback rate
      .map(function(n) {
        var minutes = START_MINUTES + n; // increment in 1 minute increments
        return {
          n: n
        , minutes: minutes
        , timestamp: EVENT_DATE + minutes * 60 * 1000 // timestamp in ms
        }
      })
      .takeWhile(function(tick) {
        return tick.minutes <= END_MINUTES;
    }).delay(1500).share();

    var clock = counter.filter(function(tick) { // reduce the counter to 5 minute increments
      return tick.timestamp % 300000 === 0;
    });

    var oldMinutes;
    var bufferProgress = scans.flatMap(function(scan) {
      var minutes = Math.floor((scan.timestamp - EVENT_DATE) / 60000.0);
      !oldMinutes && (oldMinutes = minutes);
      if (minutes === oldMinutes) {
        return Rx.Observable.empty(); // don't trigger on same minute
      } else {
        var gap = minutes - oldMinutes;
        var sequence = gap === 1 ? [minutes] : Rx.Observable.range(oldMinutes + 1, gap); // trigger on empty minutes
        oldMinutes = minutes;
        return sequence;
      }
    }).share();

    var bufferedScans = scans.buffer(bufferProgress);

    var timedScans = Rx.Observable.zip(counter, bufferedScans, function(tick, scans) {
      return scans;
    }).flatMap(function(scans) {
      return scans;
    });

    cb(clock, timedScans, bufferProgress);
  }

  return {
    eventTimeStamp: EVENT_DATE + START_MINUTES * 60 * 1000
  , START_MINUTES: START_MINUTES
  , END_MINUTES: END_MINUTES
  , users: users
  , playback: playbackSocket
  }
})(d3, Rx);
