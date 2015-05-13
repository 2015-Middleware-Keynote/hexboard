'use strict';
process.env.NODE_ENV = 'test';
process.env.DB_URL = 'mongodb://localhost/beaconlocation-test'

var _ = require('underscore')
  , app = require('./main/app')
  , Scan = require('./api/scan/scan_model')
  , mongoose = require('mongoose')
  , should = require('should')
  , restorescans = require('./restorescans')
  , locations = require('./api/location/location_controllers').locations
  ;


// mongoose.set('debug', true);

// Returns a random integer between min included) and max (excluded)
var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

function clearDB(done) {
  for (var i in mongoose.connection.collections) {
    mongoose.connection.collections[i].remove(function () {
    });
  }
  return done();
};

var now = new Date().getTime();

var scans = [];
for (var i = 0; i < 100; i++) {
  var loopScan = {
    beaconId: '1'
  , locationCode: locations[getRandomInt(0, locations.length)].code
  , type: 'check-in'
  , timestamp: now + i
  }
  scans.push(loopScan);
  loopScan = {
    beaconId: '2'
  , locationCode: locations[getRandomInt(0, locations.length)].code
  , type: 'check-in'
  , timestamp: now + i
  }
  scans.push(loopScan);
  loopScan = {
    beaconId: '3'
  , locationCode: locations[getRandomInt(0, locations.length)].code
  , type: 'check-in'
  , timestamp: now + 30 + i
  }
  scans.push(loopScan);
}

function populateDb(done) {
  Scan.create(scans, function(err, createdScans) {
    if (err) {
      console.log(err);
    };
    done();
  })
};

describe('DB Operations:', function() {
  before(function (done) {
    return clearDB(function() {
      populateDb(done);
    });
  });
  describe('restore', function() {
    it('all', function() {
      return restorescans.restoreScans().then(function(docs) {
        docs.should.have.length(3);
        docs.forEach(function(recent) {
          var userScans = scans.filter(function(filterscan) {
            return filterscan.beaconId === recent.beaconId;
          });
          var last = userScans[userScans.length - 1];
          recent.beaconId.should.equal(last.beaconId);
          new Date(recent.timestamp).getTime().should.equal(last.timestamp);
          recent.locationCode.should.equal(last.locationCode);
          recent.location.code.should.equal(last.locationCode);
        });
      });
    });
  });
});
