'use strict';

var request = require('request')
  , app = require('../../main/app.js')
  , port  = app.get('port') + 1
  , ip = app.get('base url')
  , http = require('http')
  , fs = require('fs')
  ;

require('should');

// In this test we manually invoke express since supertest ignores the query string when piping to the request

describe('Rest API:', function () {
  describe('POST /sketch', function () {
    before(function(done){
      var server = http.createServer(app);
      server.listen(9001, 'localhost', 511, done);
    });

    it('receive a file', function (done) {
      var readStream = fs.createReadStream('server/api/thousand/cherries.png');
      var url = 'http://localhost:9001/api/sketch/10?name=John%20Doe';
      var req = request.post(url, function (err, res, body) {
        if (err) {
          throw new Error(err);
        }
        body = JSON.parse(body);
        body.url.should.equal('http://beacon.jbosskeynote.com/api/sketch/10');
        body.name.should.equal('John Doe');
        done();
      });

      readStream.pipe(req);
    });
  });
});
