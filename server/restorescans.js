'use strict';

var Rx = require('rx')
  , locationHashMap = require('./api/location/location_controllers').locationHashMap
  , Scan = require('./api/scan/scan_model')
  , getUser = require('./stompscans').getUser
  ;

var restoreScans = function() {
  return Scan.aggregate()
    .sort({'timestamp': -1})
    .group({
      _id: "$beaconId"
    , timestamp: { $first: '$timestamp'}
    , location: {$first: '$location'}
    , type: {$first: '$type'}
    })
    .project({
      beaconId: '$_id'
    , location: 1
    , type: 1
    , timestamp: 1
    })
    .exec()
    .then(function(scans) {
      return scans.map(function(scan) {
        scan.user = getUser(scan.beaconId);
        scan.location = locationHashMap[scan.location];
        scan.timestamp = new Date(scan.timestamp).getTime();
        return scan;
      });
    });
};

module.exports = {
  restoreScans: restoreScans
};
