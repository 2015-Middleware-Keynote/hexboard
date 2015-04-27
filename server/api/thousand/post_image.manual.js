'use strict';

var request = require('superagent')
  , fs = require('fs')
  ;

// Returns a random integer between min included) and max (excluded)
var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var readStream = fs.createReadStream('server/api/thousand/cherries.png');
var id = getRandomInt(0,1060);
// id = "";
//var req = request.post('http://localhost:9000/api/doodle/' + id);
 var req = request.post('http://beacon.jbosskeynote.com/api/doodle/' + id);
readStream.pipe(req, {end: false});
readStream.on('end', function() {
  req.end(function (err, res) {
    if (err) {
      throw new Error(err);
    }
    console.log('res', res.body);
  });
})
