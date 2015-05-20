'use strict';

var Rx = require('rx')
  , request = require('request')
  , convertLocation = require('./api/location/location_controllers').convertLocation
  , stomp = require('./stomp')
  , WebSocket = require('ws')
  , debuglog = require('debuglog')('stomp')
  , getUser = require('./api/user/user.js').getUser
  ;

var tag = 'LIVE';

var getScanFeed = function() {
  return stomp.getBeaconEventsProcessedFeed().map(function(message) {
    var location = convertLocation(message.headers.location_id);
    var beaconId = message.headers.user_id;
    var event = {
      user: getUser(beaconId)
    , beaconId: beaconId
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
  getScanFeed: getScanFeed
};
