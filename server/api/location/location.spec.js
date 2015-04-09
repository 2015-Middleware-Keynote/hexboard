'use strict';

var request = require('supertest')
  , app = require('../../main/app')
  , _ = require('underscore')
  ;

require('should');

describe('Rest API:', function () {
  describe('GET /locations', function () {
    it('get all locations', function (done) {
      request(app).get('/api/locations')
        .expect(200)
        .end(function (err, res) {
          res.body.length.should.be.equal(12);
          res.body[0].name.should.be.equal('Entrance');
          done();
        });
    });
  });
  describe('GET /location', function () {
    it('get a location', function (done) {
      request(app).get('/api/location/0')
        .expect(200)
        .end(function (err, res) {
          res.body.name.should.be.equal('Entrance');
          done();
        });
    });
  });
});
