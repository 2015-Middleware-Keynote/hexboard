'use strict';
process.env.NODE_ENV = 'test';
process.env.DB_URL = 'mongodb://localhost/beaconlocation-test'

var request = require('supertest')
  , app = require('../../main/app')
  , _ = require('underscore')
  , Scan = require('./scan_model')
  , mongoose = require('mongoose')
  , should = require('should')
  ;

// mongoose.set('debug', true);

function clearDB(done) {
  for (var i in mongoose.connection.collections) {
    mongoose.connection.collections[i].remove(function () {
    });
  }
  return done();
}

var testUser = {
  firstName: 'John'
, lastName: 'Doe'
, beaconId: '[0,1]'
}

var testLocation = {
  id: 7
, x_i: 680
, y_i: 1170
, code: 'Room201'
, name: 'Room 201 DEVNATION Track'
}

var now = new Date().getTime();

var testScan = {
  beaconId: '[0,1]'
, location: testLocation.code
, type: 'check-in'
, timestamp: now
}

describe('DB Operations:', function() {
  before(function (done) {
    return clearDB(done);
  });
  describe('scan', function() {
    it('create', function() {
      return Scan.create(testScan).then(function (createdScan) {
        createdScan.beaconId.should.equal(testScan.beaconId);
        createdScan.location.should.equal(testScan.location);
        createdScan.type.should.equal(testScan.type);
        createdScan.timestamp.getTime().should.equal(testScan.timestamp);
        createdScan.created.getTime().should.be.greaterThan(now);
      });
    });
    it('find', function() {
      return Scan.find({
        beaconId: testScan.beaconId
      })
      .exec().then(function (scans) {
        (scans).should.have.length(1);
        var foundScan = scans[0];
        foundScan.beaconId.should.equal(testScan.beaconId);
        foundScan.location.should.equal(testScan.location);
        foundScan.type.should.equal(testScan.type);
        foundScan.timestamp.getTime().should.equal(testScan.timestamp);
        foundScan.created.getTime().should.be.greaterThan(now);
      }, function (reason) {
        throw new Error(reason);
      });
    });
  });
});

describe('Rest API:', function () {
  describe('GET /scan', function () {
    it('get a scan', function (done) {
      request(app).get('/api/scans/[0,1]')
        .expect(200)
        .end(function (err, res) {
          res.body.should.have.length(1);
          var foundScan = res.body[0];
          foundScan.beaconId.should.equal(testScan.beaconId);
          foundScan.location.should.equal(testScan.location);
          foundScan.type.should.equal(testScan.type);
          new Date(foundScan.timestamp).getTime().should.equal(testScan.timestamp);
          new Date(foundScan.created).getTime().should.be.greaterThan(now);
          done();
        });
    });
  });
});
