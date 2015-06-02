'use strict';

var fs = require('fs')
  , os = require('os')
  , randomSketches = require('../../thousand/random').randomSketches
  , thousandEmitter = require('../../thousand/thousandEmitter')
  , request = require('request')
  , pod = require('../../thousand/pod')
  ;

var tag = 'API/THOUSAND';

var postImageToPod = function(sketch, filename, callback) {
  var putUrl = sketch.pod.url + '/doodle?username='+sketch.name+'&cuid='+sketch.cuid+'&submission='+sketch.submissionId;
  var readStream = fs.createReadStream(filename);
  readStream.pipe(request.put(putUrl, function (err, res, body) {
    if (err) {
      throw new Error(err);
    }
    console.log('res', res.body);
    callback(res.body);
  }));
};

module.exports = exports = {
  receiveImage: function(req, res, next) {
    console.log(tag, 'originalUrl', req.originalUrl);
    var data = new Buffer('');
    req.on('data', function(chunk) {
      data = Buffer.concat([data, chunk]);
    });
    req.on('error', function(err) {
      next(err);
    });
    req.on('end', function() {
      pod.getRandomPod.map(function(randomPod) {
        var sketch = {
          pod: randomPod
        , containerId: randomPod.id
        , url: randomPod.url
        , uiUrl: '/api/sketch/' + randomPod.id
        , name: req.query.name
        , cuid: req.query.cuid
        , submissionId: req.query.submission_id
        };
        pod.skecth = sketch;
        console.log(tag, sketch);
        return sketch;
      }).tap(function(sketch) {
        var filename = 'thousand-sketch' + sketch.pod.id + '.png';
        fs.open(os.tmpdir() + '/' + filename, 'w', function(err, fd) {
          if (err) {
            next(err);
          };
          fs.write(fd, data, 0, data.length, 0, function(err, written, buffer) {
            if (err) {
              next(err);
            };
            thousandEmitter.emit('new-sketch', sketch);
            postImageToPod(sketch, os.tmpdir() + '/' + filename, function(msg) {
              return res.json(sketch);
            })
          });
        });
      })
      .subscribeOnError(function(err) {
        console.log(err)
        next(err);
      });
    });
  },

  getImage: function(req, res, next) {
    var containerId = parseInt(req.params.containerId);
    var filename = 'thousand-sketch' + containerId + '.png';
    fs.createReadStream(os.tmpdir() + '/' + filename, {
      'bufferSize': 4 * 1024
    }).pipe(res);
  },

  removeImage: function(req, res, next) {
    var containerId = req.params.containerId;
    if (containerId === 'all') {
      thousandEmitter.emit('remove-all');
      res.send('removed all');
    } else {
      containerId = parseInt(containerId);
      var filename = 'thousand-sketch' + containerId + '.png';
      thousandEmitter.emit('remove-sketch', containerId);
      fs.createReadStream('./server/api/thousand/censored.png').pipe(fs.createWriteStream(os.tmpdir() + '/' + filename));
      res.send('removed');
    };
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
