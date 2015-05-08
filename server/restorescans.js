'use strict';

var Rx = require('rx')
  , convertLocation = require('./api/location/location_controllers').convertLocation
  , Scan = require('./api/scan/scan_model')
  , getUser = require('./beacon-live').getUser
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
        scan.location = convertLocation(scan.location);
        scan.timestamp = new Date(scan.timestamp).getTime();
        scan.retransmit = false;
        return scan;
      });
    });
};

module.exports = {
  restoreScans: restoreScans
};
