'use strict';
process.env.NODE_ENV = 'test';
process.env.DB_URL = 'mongodb://localhost/beaconlocation-test'

var request = require('supertest')
  , app = require('../../main/app')
  , _ = require('underscore')
  , User = require('./user_model')
  , mongoose = require('mongoose')
  , should = require('should')
  ;

// mongoose.set('debug', true);

describe('Rest API:', function () {
  describe('GET /users', function () {
    it('get all users', function (done) {
      request(app).get('/api/users')
        .expect(200)
        .end(function (err, res) {
          res.body.length.should.be.equal(200);
          res.body[13].name.should.be.equal('Burr Sutter');
          done();
        });
    });
  });
  describe('GET /user', function () {
    it('get a user', function (done) {
      request(app).get('/api/user/13')
        .expect(200)
        .end(function (err, res) {
          res.body.name.should.be.equal('Burr Sutter');
          done();
        });
    });
  });
});

function clearDB(done) {
  for (var i in mongoose.connection.collections) {
    mongoose.connection.collections[i].remove(function () {
    });
  }
  return done();
}

describe('DB Operations:', function() {
  var user = {
    firstName: 'John'
  , lastName: 'Doe'
  , beaconId: '[0,1]'
  }
  var now = new Date().getTime();

  before(function (done) {
    return clearDB(done);
  });
  after(function (done) {
    return clearDB(done);
  });
  describe('user', function() {
    it('create', function() {
      return User.create(user).then(function (createdUser) {
          createdUser.firstName.should.equal(user.firstName);
          createdUser.lastName.should.equal(user.lastName);
          createdUser.beaconId.should.equal(user.beaconId);
          createdUser.created.getTime().should.be.greaterThan(now);
        });
    });
    it('find', function() {
      return User.find({
          firstName: user.firstName
        })
        .exec().then(function (users) {
          console.log(users.length);
          (users).should.have.length(1);
          users[0].firstName.should.equal(user.firstName);
          users[0].lastName.should.equal(user.lastName);
          users[0].beaconId.should.equal(user.beaconId);
        }, function (reason) {
          throw new Error(reason);
        });
    });
  });
});
