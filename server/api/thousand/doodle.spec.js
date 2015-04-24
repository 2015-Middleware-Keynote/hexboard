'use strict';

var request = require('supertest')
  , app = require('../../main/app')
  , _ = require('underscore')
  , fs = require('fs')
  ;

require('should');

describe('Rest API:', function () {
  describe('POST /doodle', function () {
    it('receive a file', function (done) {
      var readStream = fs.createReadStream('server/api/thousand/cherries.png');
      var req = request(app).post('/api/doodle');
      readStream.pipe(req, {end: false});
      readStream.on('end', function() {
        req.end(function (err, res) {
          // console.log('res', res.body)
          if (err) {
            throw new Error(err);
          }
          res.body.should.equal('Sent!');
          done();
        });
      })
    });
  });
});
