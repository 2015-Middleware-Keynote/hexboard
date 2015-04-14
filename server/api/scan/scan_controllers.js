'use strict';

var Scan = require('./scan_model')
  ;

module.exports = exports = {
  getScan: function(req, res, next) {
    return Scan.findById(req.params.id)
    .exec().then(function(scan) {
      res.send(scan);
    }, function (reason) {
      throw new Error(reason);
    });
  }

, getScans: function(req, res, next) {
    var limit = req.params.limit || null;
    return Scan.find({
      beaconId: req.params.beaconId
    }, null, {
      skip: 0,
      limit: limit,
      sort:{
        timestamp: -1 //Sort by timestamp DESC
      }
    })
    .exec().then(function (scans) {
      res.send(scans);
    }, function (reason) {
      throw new Error(reason);
    });
  }
};
