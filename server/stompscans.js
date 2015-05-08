'use strict';

var Rx = require('rx')
  , locations = require('./api/location/location_controllers').locations
  , locationHashMap = require('./api/location/location_controllers').locationHashMap
  , Stomp = require('stompjs')
  , WebSocket = require('ws')
  , debuglog = require('debuglog')('stomp')
  ;

var tag = 'STOMP';

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
}

var connection = Rx.Observable.create(function (observer) {
  console.log(tag, new Date());
  console.log(tag, 'Connecting...');
  var client = Stomp.overWS('ws://52.10.252.216:61614', ['v12.stomp']);
  // client.heartbeat = {outgoing: 0, incoming: 0}; // a workaround for the failing heart-beat
  // client.heartbeat.incoming = 20000;
  client.debug = function(m) {
    debuglog(new Date());
    debuglog(m);
  };
  client.connect('admin', 'admin', function(frame) {
    debuglog(frame.toString());
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
        console.log(tag, 'Unmapped location code: ' + code);
        location = locationHashMap['Entrance'];
    };
  }
  return location;
}

var getStompFeed = function(queue) {
  return connection.flatMap(function(client) {
    return Rx.Observable.create(function (observer) {
      console.log(tag, 'Subscribing to ' + queue + '...');
      client.subscribe(queue, function(message) {
        message.ack();
        var location = convertLocation(message.headers.location_id);
        var id = JSON.parse(message.headers.user_id);
        var user = id[0]*10 + id[1];
        var event = {
          user: getUser(id)
        , beaconId: message.headers.user_id
        , location: location
        , type: message.headers.type || 'check-in'
        , retransmit: message.headers.retransmit === 'true'
        , timestamp: message.headers.timestamp * 1000
        }
        if (!event.timestamp) {
          event.timestamp = new Date().getTime();
        }
        // debuglog('Event | user: ', event.user.name, 'location: ', event.location.name);
        observer.onNext(event);
        return function() {
          client.disconnect(function() {
            console.log(tag, 'Disconnected.');
          });
        };
      }
      , {'ack': 'client'}
      )
    })
  }).share();
};

module.exports = {
  users: users
, getUser: getUser
, convertLocation: convertLocation
, getStompFeed: getStompFeed
};
