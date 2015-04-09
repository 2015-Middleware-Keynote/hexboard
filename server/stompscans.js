'use strict';

var Rx = require('rx')
  , locations = require('./api/location/location_controllers').locations
  , Stomp = require('stompjs')
  , WebSocket = require('ws')
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

var getUser = function(id) {
  var idInt = id[0]*100000 + id[1];
  if (! (idInt in idMap)) {
    idMap[idInt] = lastIndex;
    lastIndex++;
  }
  var index = idMap[idInt];
  return users[index];
}

var queue = process.env.NODE_ENV === 'production'
            ? '/queue/replay_processed'
            : '/topic/replay_processed_dev';

var live = Rx.Observable.create(function (observer) {
  console.log(new Date());
  console.log('Connecting...');
  var client = Stomp.overWS('ws://52.10.252.216:61614', ['v12.stomp']);
  client.heartbeat = {outgoing: 0, incoming: 0}; // a workaround for the failing heart-beat
  client.debug = undefined;
  // client.debug = function(m) {
  //   console.log(new Date());
  //   console.log(m);
  // };
  client.connect('admin', 'admin', function(frame) {
    console.log(frame.toString());
    observer.onNext(client);
  }, function(error) {
    console.error(error);
    observer.onError(new Error(error));
  });
})
.retry()
.flatMap(function(client) {
  return Rx.Observable.create(function (observer) {
    console.log('Subscribing to ' + queue + '...');
    client.subscribe(queue, function(message) {
      message.ack();
      var location;
      switch(message.headers.location_id) {
        case 'Room201':
          location = 7;
          break;
        case 'Room202':
          location = 8;
          break;
        case 'Room203':
          location = 9;
          break;
        case 'Room204':
          location = 10;
          break;
        case 'Room205':
          location = 11;
          break;
        case 'Room206':
          location = 6;
          break;
        default:
          location = 0;
      }
      var id = JSON.parse(message.headers.user_id);
      var user = id[0]*10 + id[1];
      var event = {
        user: getUser(id)
      , location: locations[location]
      , type: 'check-in'
      , timestamp: message.headers.timestamp * 1000
      }
      if (process.env.DEBUG) {
        console.log('Event | user: ', event.user.name, 'location: ', event.location.name);
      };
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

var subject = new Rx.Subject();
live.subscribe(subject);

module.exports = {
  users: users
, scans: live
};
