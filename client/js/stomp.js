'use strict';

var d3demo = d3demo || {};

d3demo.stomp = (function stompFeed(d3, Rx) {
  var idMap = {};
  var lastIndex = 0;
  var getUser = function(id) {
    var idInt = id[0]*100000 + id[1];
    if (! (idInt in idMap)) {
      idMap[idInt] = lastIndex;
      lastIndex++;
    }
    var index = idMap[idInt];
    return d3demo.layout.users[index];
  }

  var client = Stomp.client('ws://52.10.252.216:61614', ['v12.stomp']);
  client.heartbeat = {outgoing: 0, incoming: 0}; // a workaround for the failing heart-beat
  client.debug = undefined;

  var live = Rx.Observable.create(function (observer) {
    console.log('Connecting...')
    client.connect('admin', 'admin', function(frame) {
      console.log(frame.toString());
      observer.onNext();
    }, function(error) {
      observer.onError(new Error(error));
    });
  })
  .flatMap(function() {
    return Rx.Observable.create(function (observer) {
      client.subscribe('/queue/replay_processed', function(message) {
        message.ack();
        observer.onNext(message);
        return function() {
          client.disconnect(function() {
            console.log('Disconnected.');
          });
        };
      }
      , {'ack': 'client'
      })
    })
  })
  .map(function(message) {
    var location;
    switch(message.headers.location_id) {
      case 'Room201':
        location = 7;
        break;
      case 'Room202':
        location = 8;
        break;
      case 'Room204':
        location = 10;
        break;
      default:
        location = 0;
    }
    var id = JSON.parse(message.headers.user_id);
    var user = id[0]*10 + id[1];
    var event = {
      user: getUser(id)
    , location: d3demo.layout.locations[location]
    , type: 'check-in'
    , timestamp: message.headers.timestamp * 1000
    }
    return event;
    console.log(event);
  });

  return {
    scans: live
  }
})(d3, Rx);
