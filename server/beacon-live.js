'use strict';

var Rx = require('rx')
  , Scan = require('./api/scan/scan_model')
  , request = require('request')
  , convertLocation = require('./api/location/location_controllers').convertLocation
  , stomp = require('./stomp')
  , WebSocket = require('ws')
  , debuglog = require('debuglog')('stomp')
  , getUser = require('./api/user/user.js').getUser
  , agSender = require( 'unifiedpush-node-sender' )
  ;

var tag = 'LIVE';

var pushUrl = 'https://jbossunifiedpush-lholmqui.rhcloud.com/ag-push/';
var pushSettings = {
    applicationID: 'dad69963-899f-4b79-a4e5-c73efc5c25a8', // should stay
    masterSecret: '26cd13b2-2155-4c90-ae80-922532d67728', // should stay
};

var saveScan = function(scan) {
  Scan.create({
    beaconId: scan.beaconId
  , locationCode: scan.locationCode
  , type: scan.type
  , retransmit: scan.retransmit
  , timestamp: scan.timestamp
  }).then(function (createdScan) {
    // console.log(tag, 'Saved scan for beacon: ', createdScan.beaconId);
    // process.stdout.write('.');
    if (!scan.retransmit) {
      notification(createdScan);
    };
    return;
  }, function(error) {
    console.log(tag, 'Error saving scan: ', error);
  });
};

var notification = function(scan) {
  if (process.env.NODE_ENV !== 'production') {
    return;
  };
  var message = {
    alert: 'New Scan Received'
  , sound: 'default'
  , userData: {
      scanId: scan._id
    }
  };
  var settings = {
    applicationID: pushSettings.applicationID
  , masterSecret: pushSettings.masterSecret
  , criteria: {
        alias: [scan.beaconId]
    }
  }
  // Fire and forget
  agSender.Sender(pushUrl).send(message, settings)
    .on('success', function(response) {
      console.log('agSender success called', response );
      debuglog('agSender success called', response );
    })
    .on('error', function(err) {
      console.log(tag, 'Error:', err);
    });
};

var scanFeed = stomp.getBeaconEventsProcessedFeed().map(function(message) {
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

scanFeed.tap(function(scan) {
  saveScan(scan);
}).subscribeOnError(function(err) {
  console.log(err.stack || err);
});

module.exports = {
  scanFeed: scanFeed
};
