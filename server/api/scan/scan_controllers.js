'use strict';

var Scan = require('./scan_model')
  ;

module.exports = exports = {
  getScans: function(req, res, next) {
    return Scan.find({
      beaconId: req.params.beaconId
    })
    .exec().then(function (scans) {
      res.send(scans);
    }, function (reason) {
      throw new Error(reason);
    });
  }
};
