'use strict';

var fs = require('fs')
  , eventEmitter = require('../../thousand').doodleEmitter
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
          var containerId = 1;
          eventEmitter.emit('new-doodle', {
            containerId: containerId
          , url: '/api/doodle/'
          , firstname: 'FirstName' + containerId
          , lastname: 'LastName' + containerId
          })
          return res.json('Sent!');
        });
      })
    });
  },

  getImage: function(req, res, next) {
    fs.createReadStream('/tmp/thousand-doodle.png', {
      'bufferSize': 4 * 1024
    }).pipe(res);
  }
};
