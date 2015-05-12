'use strict';

var d3demo = d3demo || {};

d3demo.playback = (function dataPlayback(d3, Rx) {
  var pauser = new Rx.Subject();
  var counter;

  var playback = function(feed) {
    var minutes, START_MINUTES, END_MINUTES, START_TIME;
    var setupFeed = feed.filter(function(message) {
      return message.type === 'setup';
    }).tap(function(message) {
      var data = message.data;
      START_TIME = data.startTime;
      START_MINUTES = Math.floor(data.startTime / 60000);
      END_MINUTES = Math.floor((data.endTime - data.startTime) / 60000) + START_MINUTES; // account for day boundaries
      console.log('Playback range: ', new Date(data.startTime), new Date(data.endTime));
      minutes = START_MINUTES;
      counter.connect();
    }).take(1);

    var scans1 = feed.filter(function(message) {
      return message.type === 'scan';
    }).map(function(message) {
      return message.data;
    });

    var scans2 = feed.filter(function(message) {
      return message.type === 'scanBundle';
    }).flatMap(function(scanBundle) {
      return scanBundle.data;
    });

    var scans = Rx.Observable.merge(scans1, scans2).share();

    counter = Rx.Observable.interval(50)  // determines the playback rate
      .map(function(n) {
        return {
          n: n
        , minutes: minutes++ // increment in 1 minute increments
        , timestamp: minutes * 60 * 1000 // timestamp in ms
        }
      })
      .takeWhile(function(tick) {
        return tick.minutes <= END_MINUTES;
    }).pausable(pauser).publish();

    var clock = counter.filter(function(tick) { // reduce the counter to 5 minute increments
      return tick.timestamp % 300000 === 0;
    }).map(function(tick) {
      tick.date = new Date(tick.timestamp);
      tick.percent = 100 * (tick.minutes - START_MINUTES ) / (END_MINUTES - START_MINUTES);
      return tick;
    });

    var bufferMinutes;

    var bufferProgress = scans.flatMap(function(scan) {
      var scanMinutes = Math.floor((scan.timestamp - START_TIME) / 60000.0);
      !bufferMinutes && (bufferMinutes = minutes);
      if (scanMinutes === bufferMinutes) {
        return Rx.Observable.empty(); // don't trigger on same minute
      } else {
        var gap = scanMinutes - bufferMinutes;
        var sequence = gap === 1 ? [scanMinutes] : Rx.Observable.range(bufferMinutes + 1, gap); // trigger on empty minutes
        bufferMinutes = scanMinutes;
        return sequence;
      }
    }).map(function(scanMinutes) {
      var percent = 100 * (scanMinutes) / (END_MINUTES - START_MINUTES);
      return percent;
    }).share();

    var bufferedScans = scans.buffer(bufferProgress);

    var timedScans = Rx.Observable.zip(counter, bufferedScans, function(tick, scans) {
      return scans;
    }).flatMap(function(scans) {
      return scans;
    });

    setupFeed.subscribeOnError(function (err) {
      console.log(err)
    });

    return {
      scans: timedScans
    , clockProgress: clock
    , bufferProgress: bufferProgress
    }
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
    pause: pause
  , resume: resume
  , step: step
  , playback: playback
  }
})(d3, Rx);
