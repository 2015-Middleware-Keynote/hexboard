'use strict';

var Rx = require('rx')
  , locations = require('./api/location/location_controllers').locations
  , locationHashMap = require('./api/location/location_controllers').locationHashMap
  , Stomp = require('stompjs')
  , WebSocket = require('ws')
  , debuglog = require('debuglog')('stomp')
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
}

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

var getStompFeed = function(queue) {
  return connection.flatMap(function(client) {
    return Rx.Observable.create(function (observer) {
      console.log('Subscribing to ' + queue + '...');
      client.subscribe(queue, function(message) {
        message.ack();
        var location;
        switch(message.headers.location_id) {
          case 'Entrance':
          case 'General':
          case 'Lunch1':
          case 'Lunch2':
          case 'Booth1':
          case 'Booth2':
          case 'Room200':
          case 'Room201':
          case 'Room202':
          case 'Room203':
          case 'Room204':
          case 'Ballroom':
            location = locationHashMap[message.headers.location_id];
            break;
          case 'Room205':
            location = locationHashMap['Ballroom'];
            break;
          case 'Room206':
            location = locationHashMap['Room200'];
            break;
          default:
            location = locationHashMap['Entrance'];
        }
        var id = JSON.parse(message.headers.user_id);
        var user = id[0]*10 + id[1];
        var event = {
          user: getUser(id)
        , beaconId: message.headers.user_id
        , location: location
        , type: 'check-in'
        , timestamp: message.headers.timestamp * 1000
        }
        // debuglog('Event | user: ', event.user.name, 'location: ', event.location.name);
        observer.onNext(event);
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

module.exports = {
  users: users
, getStompFeed: getStompFeed
};
