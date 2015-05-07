'use strict';

var Rx = require('rx')
  , locations = require('./api/location/location_controllers').locations
  , locationHashMap = require('./api/location/location_controllers').locationHashMap
  , Stomp = require('stompjs')
  , WebSocket = require('ws')
  , debuglog = require('debuglog')('stomp')
  , http = require('http')
  , request = require('request')
  , url = require('url')
  ;

var idMap = {};
var lastIndex = 0;

var users = [];
// initialize the users
for (var i = 0; i < 200; i++) {
  users.push({
    id: i
  , name: i === 13 ? 'Burr Sutter' : 'Firstname' + i + ' Lastname' + i
  });
};

var getUser = function(idInt) {
  if (! (idInt in idMap)) {
    idMap[idInt] = lastIndex;
    lastIndex++;
  }
  var index = idMap[idInt];
  return users[index];
};

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
        console.log(msg);
        console.log('err', err);
        console.log('res', res);
        console.log('body', body);
        msg += err;
        observer.onError(msg);
      }
    });
  })
  .retryWhen(function(errors) {
    return errors.delay(2000);
  });
};

var connection = Rx.Observable.create(function (observer) {
  console.log(new Date());
  console.log('Connecting...');
  var client = Stomp.overWS('ws://52.10.252.216:61614', ['v12.stomp']);
  // client.heartbeat = {outgoing: 0, incoming: 0}; // a workaround for the failing heart-beat
  // client.heartbeat.incoming = 20000;
  client.debug = function(m) {
    debuglog(new Date());
    // console.log(new Date());
    debuglog(m);
    // console.log(m);
  };
  client.connect('admin', 'admin', function(frame) {
    console.log(frame.toString());
    observer.onNext(client);
  }, function(error) {
    console.error(error);
    observer.onError(new Error(error));
  });
})
.retryWhen(function(errors) {
  return errors.delay(2000);
}).share();

var convertLocation = function(code) {
  var location = locationHashMap[code];
  if (!location) {
    switch(code) {
      case 'Room205':
        location = locationHashMap['Ballroom'];
        break;
      case 'Room206':
        location = locationHashMap['Room200'];
        break;
      case 'Unknown':
        location = locationHashMap['Entrance'];
        break;
      default:
        console.log('Unmapped location code: ' + code);
        location = locationHashMap['Entrance'];
    };
  }
  return location;
}

var getStompFeed = function(queue) {
  return connection.flatMap(function(client) {
    return Rx.Observable.create(function (observer) {
      console.log('Subscribing to ' + queue + '...');
      client.subscribe(queue, function(message) {
        message.ack();
        observer.onNext(message);
        return function() {
          client.disconnect(function() {
            console.log('Disconnected.');
          });
        };
      }
      , {'ack': 'client'}
      )
    })
  }).share();
};

var interval = 500;
var num = 500 * interval / 1000;

var beaconEventsLive = function() {
  return getStompFeed('/topic/beaconEvents')
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
  return getStompFeed('/topic/beaconEvents_processed')
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
};

var liveFeed = function() {
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
    getEnqueueCount('/hawtio/jolokia/read/org.apache.activemq:type=Broker,brokerName=localhost,destinationType=Topic,destinationName=beaconEvents_processed/EnqueueCount')
      .map(function(count) {
        return {
          type: 'enqueueCount',
          data: {
            count: count,
            topic: 'beaconEventsProcessed'
          }
        }
      }),
    beaconEventsLive(),
    beaconEventsProcessedLive()
  );
}

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
    getEnqueueCount('/hawtio/jolokia/read/org.apache.activemq:type=Broker,brokerName=localhost,destinationType=Topic,destinationName=beaconEvents_processed/EnqueueCount')
      .map(function(count) {
        return {
          type: 'enqueueCount',
          data: {
            count: count,
            topic: 'beaconEventsProcessed'
          }
        }
      }),
    beaconEventsRandom(),
    beaconEventsProcessedRandom()
  );
};

module.exports = {
  eventFeed: liveFeed
, interval: interval
};
