'use strict';

var request = require('superagent')
  , fs = require('fs')
  ;

var readStream = fs.createReadStream('server/api/thousand/cherries.png');
var req = request.post('http://localhost:9000/api/doodle');
readStream.pipe(req, {end: false});
readStream.on('end', function() {
  req.end(function (err, res) {
    if (err) {
      throw new Error(err);
    }
    console.log('res', res.body);
  });
})
