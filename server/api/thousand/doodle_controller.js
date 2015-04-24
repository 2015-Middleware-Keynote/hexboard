'use strict';

var fs = require('fs')
  , os = require('os')
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
      var containerId = parseInt(req.params.containerId);
      if (containerId < 0 || containerId >= 1060) {
        next('Invalid containerId');
      }
      var filename = 'thousand-doodle' + containerId + 'png';
      fs.open(os.tmpdir() + '/' + filename, 'w', function(err, fd) {
        if (err) {
          next(err);
        };
        fs.write(fd, data, 0, data.length, 0, function(err, written, buffer) {
          if (err) {
            next(err);
          };
          eventEmitter.emit('new-doodle', {
            containerId: containerId
          , url: '/api/doodle/' + containerId
          , firstname: 'FirstName' + containerId
          , lastname: 'LastName' + containerId
          })
          return res.json({url:'http://beacon.jbosskeynote.com/api/doodle/'+containerId});
        });
      })
    });
  },

  getImage: function(req, res, next) {
    var containerId = parseInt(req.params.containerId);
    var filename = 'thousand-doodle' + containerId + 'png';
    fs.createReadStream(os.tmpdir() + '/' + filename, {
      'bufferSize': 4 * 1024
    }).pipe(res);
  }
};
