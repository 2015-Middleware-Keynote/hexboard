'use strict';

var fs = require('fs')
  , eventEmitter = new require("events").EventEmitter();
  ;

module.exports = exports = {
  receiveImage: function(req, res, next) {
    var data = new Buffer('');
    req.on('data', function(chunk) {
      data = Buffer.concat([data, chunk]);
    });
    req.on('error', function(err) {
      next(err);
    });
    req.on('end', function() {
      fs.open('/tmp/thousand-doodle.png', 'w', function(err, fd) {
        if (err) {
          next(err);
        };
        fs.write(fd, data, 0, data.length, 0, function(err, written, buffer) {
          if (err) {
            next(err);
          };
          eventEmitter.emit('new-doodle', {url: '/tmp/thousand-doodle.png'})
          return res.json('Sent!');
        });
      })
    });
  }
};
