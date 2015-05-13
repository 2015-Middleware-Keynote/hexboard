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
};

var testUser = {
  firstName: 'John'
, lastName: 'Doe'
, beaconId: '1'
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
  beaconId: '1'
, locationCode: testLocation.code
, type: 'check-in'
, timestamp: now
}

var testScanId;

function populateDb(done) {
  var scans = [];
  for (var i = 1; i < 100; i++) {
    var loopScan = _.extend({}, testScan);
    loopScan.timestamp = now + i;
    scans.push(loopScan);
  }
  Scan.create(scans, function(err) {
    done();
  })
};

describe('DB Operations:', function() {
  before(function (done) {
    return clearDB(function() {
      populateDb(done);
    });
  });
  describe('scan', function() {
    it('create', function() {
      return Scan.create(testScan).then(function (createdScan) {
        createdScan.beaconId.should.equal(testScan.beaconId);
        createdScan.locationCode.should.equal(testScan.locationCode);
        createdScan.type.should.equal(testScan.type);
        createdScan.timestamp.getTime().should.equal(testScan.timestamp);
        createdScan.created.getTime().should.be.greaterThan(now);
      });
    });
    it('find all', function() {
      return Scan.find({
        beaconId: testScan.beaconId
      }, null, {
        sort:{
          timestamp: -1 //Sort by timestamp DESC
        }
      })
      .exec().then(function (scans) {
        (scans).should.have.length(100);
        var foundScan = scans[99];
        foundScan.beaconId.should.equal(testScan.beaconId);
        foundScan.locationCode.should.equal(testScan.locationCode);
        foundScan.type.should.equal(testScan.type);
        foundScan.timestamp.getTime().should.equal(testScan.timestamp);
        foundScan.created.getTime().should.be.greaterThan(now);
      }, function (reason) {
        throw new Error(reason);
      });
    });
    it('find latest 10', function() {
      return Scan.find({
        beaconId: testScan.beaconId
      }, null, {
        skip: 0,
        limit: 10,
        sort:{
          timestamp: -1 //Sort by Date Added DESC
        }
      })
      .exec().then(function (scans) {
        (scans).should.have.length(10);
        scans[0].timestamp.getTime().should.equal(testScan.timestamp + 99);
        scans[1].timestamp.getTime().should.equal(testScan.timestamp + 98);
      }, function (reason) {
        throw new Error(reason);
      });
    });
  });
});

describe('Rest API:', function () {
  describe('GET /scan', function () {
    it('get all scans', function (done) {
      request(app).get('/api/scans/1')
        .expect(200)
        .end(function (err, res) {
          res.body.should.have.length(100);
          var foundScan = res.body[99];
          foundScan.beaconId.should.equal(testScan.beaconId);
          foundScan.locationCode.should.equal(testScan.locationCode);
          foundScan.type.should.equal(testScan.type);
          new Date(foundScan.timestamp).getTime().should.equal(testScan.timestamp);
          new Date(foundScan.created).getTime().should.be.greaterThan(now);
          done();
        });
    });
    it('get 10 latest scans', function (done) {
      request(app).get('/api/scans/1/limit/10')
        .expect(200)
        .end(function (err, res) {
          res.body.should.have.length(10);
          var scans = res.body;
          new Date(scans[0].timestamp).getTime().should.equal(testScan.timestamp + 99);
          new Date(scans[1].timestamp).getTime().should.equal(testScan.timestamp + 98);
          testScanId = scans[0]['_id']; // store the id for the next test :-P
          done();
        });
    });
    it('get scan by id', function (done) {
      request(app).get('/api/scan/' + testScanId)
        .expect(200)
        .end(function (err, res) {
          var scan = res.body;
          new Date(scan.timestamp).getTime().should.equal(testScan.timestamp + 99);
          done();
        });
    });
  });
});
