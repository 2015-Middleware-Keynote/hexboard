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
      // 'ws://127.8.195.129:8000'
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
    }).delay(200).share();

    var clock = counter.filter(function(tick) { // reduce the counter to 5 minute increments
      return tick.timestamp % 300000 === 0;
    });

    var oldMinutes = -1;
    var bufferedScans = scans.buffer(scans.filter(function(scan) {
        var millis = scan.timestamp - EVENT_DATE;
        var minutes = Math.floor(millis / 60000.0);
        if (minutes > oldMinutes) {
          oldMinutes = (oldMinutes === -1) ? minutes : oldMinutes + 1;
          var myEvent = new CustomEvent('bufferincrement', {detail: {minutes: minutes}});
          document.dispatchEvent(myEvent);
          return true;
        } else {
          return false;
        }
    })).filter(function(scan) {
      scan.length ===0 && console.log(scan.length);
      return true;
    });

    var timedScans = Rx.Observable.zip(counter, bufferedScans, function(tick, scans) {
      return scans;
    }).flatMap(function(scans) {
      return scans;
    });

    cb(clock, timedScans);
  }

  return {
    eventTimeStamp: EVENT_DATE + START_MINUTES * 60 * 1000
  , START_MINUTES: START_MINUTES
  , END_MINUTES: END_MINUTES
  , users: users
  , playback: playbackSocket
  }
})(d3, Rx);
