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

var getEnqueueCount = Rx.Observable.create(function (observer) {
  request.get('http://admin:admin@broker.jbosskeynote.com:8181/hawtio/jolokia/read/org.apache.activemq:type=Broker,brokerName=localhost,destinationType=Topic,destinationName=beaconEvents/EnqueueCount'
  , function (err, res, body) {
      var enqueueCount;
      if (err || res.statusCode !== 200) {
        console.log('Error', res.statusCode, err, '; Proceeding with enqueueCount = 0');
        enqueueCount = 0;
      } else {
        console.log('body', body, '/body');
        data = JSON.parse(body);
        enqueueCount = data.value;
      }
      observer.onNext(enqueueCount);
      observer.onCompleted();
    });
  });

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

var interval = 100;
var num = 50;

var getRandomFeed = function(queue) {
  return getEnqueueCount.flatMap(function(enqueueCount) {
    return Rx.Observable.interval(interval).map(function(x) {
        return {enqueueCount: enqueueCount, x: x, num: num};
      })
    });
}

module.exports = {
  getStompFeed: getRandomFeed
, interval: interval
};
