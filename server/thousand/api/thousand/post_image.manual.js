'use strict';

var request = require('request')
  , fs = require('fs')
  ;

// Returns a random integer between min included) and max (excluded)
var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var readStream = fs.createReadStream('server/api/thousand/cherries.png');
var id = getRandomInt(0,1060);
var url = 'http://localhost:9000/api/sketch/' + id + '?name=John%20Doe&cuid=test&submission_id=123';
// var url = 'http://beacon.jbosskeynote.com/api/sketch/' + id + '?name=John%20Doe&cuid=test&submission_id=123';
var req = request.post(url, function (err, res, body) {
  if (err) {
    throw new Error(err);
  }
  console.log('res', res.body);
});
 //
readStream.pipe(req);
