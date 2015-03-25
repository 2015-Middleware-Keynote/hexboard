'use strict';

var request = require('supertest')
  , app = require('../../main/app')
  , _ = require('underscore')
  ;

require('should');

describe('Rest API:', function () {
  describe('GET /users', function () {
    it('get all users', function (done) {
      request(app).get('/api/users')
        .expect(200)
        .end(function (err, res) {
          // console.log(res.body);
          res.body.length.should.be.equal(200);
          res.body[13].name.should.be.equal('Burr Sutter');
          done();
        });
    });
  });
});
