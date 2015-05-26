'use strict';

var Rx = require('rx')
  , stomp = require('./stomp')
  , debuglog = require('debuglog')('broker')
  , request = require('request')
  ;

var tag = 'BROKER';

var getEnqueueCount = function(url) {
  return Rx.Observable.create(function (observer) {
  request.get({
    baseUrl: 'http://broker.jbosskeynote.com:8181/',
    url: url,
    auth: {
      user: 'admin',
      pass: 'admin'
    },
    headers: {
      'User-Agent' : 'curl'
    },
    timeout: 20000
  }
  , function (err, res, body) {
      var enqueueCount;
      if (res && res.statusCode === 200 && body) {
        var data = JSON.parse(body);
        enqueueCount = data.value;
        observer.onNext(enqueueCount);
        observer.onCompleted();
      } else {
        var msg = 'getEnqueueCount Error: ';
        if (res && res.statusCode) {
          msg += res.statusCode;
        }
        console.log(tag, msg);
        console.log(tag, 'err', err);
        console.log(tag, 'res', res);
        console.log(tag, 'body', body);
        msg += err;
        observer.onError(msg);
      }
    });
  })
  .retryWhen(function(errors) {
    return errors.delay(2000);
  });
};

var enqueueCountsFeed = function() {
  return Rx.Observable.merge(
    getEnqueueCount('/hawtio/jolokia/read/org.apache.activemq:type=Broker,brokerName=localhost,destinationType=Topic,destinationName=beaconEvents/EnqueueCount')
      .map(function(count) {
        return {
          type: 'enqueueCount',
          data: {
            count: count,
            topic: 'beaconEvents'
          }
        }
      }),
    getEnqueueCount('/hawtio/jolokia/read/org.apache.activemq:type=Broker,brokerName=localhost,destinationType=Topic,destinationName=VirtualTopic.beaconEvents_processed/EnqueueCount')
      .map(function(count) {
        return {
          type: 'enqueueCount',
          data: {
            count: count,
            topic: 'beaconEventsProcessed'
          }
        }
      })
  );
};

var interval = 100;
var num = 500 * interval / 1000;

var beaconEventsLive = function() {
  return stomp.getBeaconEventsFeed()
  .bufferWithTime(interval).map(function(buf) {
    return {
      type: 'beaconEvents',
      data: {
        x: 0,
        num: buf.length,
        interval: interval
      }
    };
  })
};

var beaconEventsProcessedLive = function() {
  return stomp.getBeaconEventsProcessedFeed()
    .map(function(message) {
      return {
        type: message.headers.type,
        retransmit: message.headers.retransmit
      }
    })
    .bufferWithTime(50).map(function(buf) {
      return {
        type: 'beaconEventsProcessed',
        data: {
          num: buf.length,
          interval: 50,
          messages: buf
        }
      };
    })
    .filter(function(event) {
      return event.data.num > 0;
    })
};

var liveFeed = function() {
  return Rx.Observable.merge(
    beaconEventsLive(),
    beaconEventsProcessedLive()
  );
};

var randomSource = Rx.Observable.interval(interval).share();

var beaconEventsRandom = function() {
  return randomSource
      .map(function(x) {
        return {
          type: 'beaconEvents',
          data: {
            x: x,
            num: num,
            interval: interval
          }
        };
      });
};

var beaconEventsProcessedRandom = function() {
  return randomSource
      .filter(function(x) {
        return x % 50 == 0;
      })
      .map(function(x) {
        return {
          type: 'beaconEventsProcessed',
          data: {
            x: x / 50,
            num: 20,
            interval: interval * 50
          }
        };
      });
};

var randomFeed = function() {
  return Rx.Observable.merge(
    beaconEventsRandom(),
    beaconEventsProcessedRandom()
  );
};

module.exports = {
  eventFeed: liveFeed
, interval: interval
, enqueueCountsFeed: enqueueCountsFeed
};
