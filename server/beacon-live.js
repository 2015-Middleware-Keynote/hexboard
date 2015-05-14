'use strict';

var Rx = require('rx')
  , convertLocation = require('./api/location/location_controllers').convertLocation
  , stomp = require('./stomp')
  , WebSocket = require('ws')
  , debuglog = require('debuglog')('stomp')
  ;

var tag = 'LIVE';

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

var getScanFeed = function(queue) {
  return stomp.getStompFeed(queue).map(function(message) {
    var location = convertLocation(message.headers.location_id);
    var id = JSON.parse(message.headers.user_id);
    var user = id[0]*10 + id[1];
    var event = {
      user: getUser(id)
    , beaconId: message.headers.user_id
    , locationCode: message.headers.location_id
    , location: location
    , type: message.headers.type || 'check-in'
    , retransmit: message.headers.retransmit === 'true'
    , timestamp: parseInt(message.headers.timestamp)
    }
    if (!event.timestamp) {
      event.timestamp = new Date().getTime();
    }
    return event;
  }).share();
};

module.exports = {
  users: users
, getUser: getUser
, getScanFeed: getScanFeed
};
