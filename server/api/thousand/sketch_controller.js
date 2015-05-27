'use strict';

var fs = require('fs')
  , os = require('os')
  , randomSketches = require('../../thousand/random').randomSketches
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
      var filename = 'thousand-sketch' + containerId + 'png';
      fs.open(os.tmpdir() + '/' + filename, 'w', function(err, fd) {
        if (err) {
          next(err);
        };
        console.log(tag, 'originalUrl', req.originalUrl);
        fs.write(fd, data, 0, data.length, 0, function(err, written, buffer) {
          if (err) {
            next(err);
          };
          var sketch = {
            containerId: containerId
          , url: '/api/sketch/' + containerId
          , name: req.query.name
          , cuid: req.query.cuid
          , submissionId: req.query.submission_id
          };
          thousandEmitter.emit('new-sketch', sketch);
          return res.json({
            url:'http://www.jbosskeynote.com/api/sketch/'+containerId
          , name:req.query.name
          });
        });
      })
    });
  },

  getImage: function(req, res, next) {
    var containerId = parseInt(req.params.containerId);
    var filename = 'thousand-sketch' + containerId + 'png';
    fs.createReadStream(os.tmpdir() + '/' + filename, {
      'bufferSize': 4 * 1024
    }).pipe(res);
  },

  randomSketches: function(req, res, next) {
    var numSketches = req.params.numSketches;
    randomSketches(numSketches)
      .subscribe(function(sketch) {
        thousandEmitter.emit('new-sketch', sketch);
      }, function(error) {
        next(error)
      }, function() {
        console.log(tag, numSketches + ' sketches pushed');
        res.json({msg: numSketches + ' sketches pushed'});
      });
  }
};
