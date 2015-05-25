'use strict';

var fs = require('fs')
  , os = require('os')
  , randomDoodles = require('../../thousand/random').randomDoodles
  , thousandEmitter = require('../../thousand/thousandEmitter')
  ;

var tag = 'API/THOUSAND';

module.exports = exports = {
  receiveImage: function(req, res, next) {
    console.log(tag, 'originalUrl', req.originalUrl);

    var containerId = parseInt(req.params.containerId);
    if (containerId < 0 || containerId >= 1060) {
      next('Invalid containerId');
      return;
    };
    var data = new Buffer('');
    req.on('data', function(chunk) {
      data = Buffer.concat([data, chunk]);
    });
    req.on('error', function(err) {
      next(err);
    });
    req.on('end', function() {
      var filename = 'thousand-doodle' + containerId + 'png';
      fs.open(os.tmpdir() + '/' + filename, 'w', function(err, fd) {
        if (err) {
          next(err);
        };
        console.log(tag, 'originalUrl', req.originalUrl);
        fs.write(fd, data, 0, data.length, 0, function(err, written, buffer) {
          if (err) {
            next(err);
          };
          var doodle = {
            containerId: containerId
          , url: '/api/doodle/' + containerId
          , name: req.query.name
          , cuid: req.query.cuid
          , submissionId: req.query.submission_id
          };
          thousandEmitter.emit('new-doodle', doodle);
          return res.json({
            url:'http://beacon.jbosskeynote.com/api/doodle/'+containerId
          , name:req.query.name
          });
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
  },

  randomDoodles: function(req, res, next) {
    var numDoodles = req.params.numDoodles;
    randomDoodles(numDoodles)
      .subscribe(function(doodle) {
        thousandEmitter.emit('new-doodle', doodle);
      }, function(error) {
        next(error)
      }, function() {
        console.log(tag, numDoodles + ' doodles pushed');
        res.json({msg: numDoodles + ' doodles pushed'});
      });
  }
};
