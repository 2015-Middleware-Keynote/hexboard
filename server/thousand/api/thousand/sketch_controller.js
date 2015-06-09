'use strict';

var fs = require('fs')
  , os = require('os')
  , Rx = require('rx')
  , RxNode = require('rx-node')
  , randomSketches = require('../../random').randomSketches
  , thousandEmitter = require('../../thousandEmitter')
  , request = require('request')
  , pod = require('../../pod')
  ;

var tag = 'API/THOUSAND';

var saveImageToFile = function(sketch, req) {
  var filename = 'thousand-sketch' + sketch.containerId + '.png';
  console.log('Saving sketch to file:', filename);
  return Rx.Observable.create(function(observer) {
    var stream = req.pipe(fs.createWriteStream(os.tmpdir() + '/' + filename));
    req.on('end', function() {
      // console.log('File save complete:', filename);
      observer.onNext(sketch);
      observer.onCompleted();
    });
    req.on('error', function(error) {
      observer.onError(error);
    });
  });
}

var postImageToPod = function(sketch, req) {
  var putUrl = sketch.url + '/doodle?username='+sketch.name+'&cuid='+sketch.cuid+'&submission='+sketch.submissionId;
  console.log('Putting sketch to url:', putUrl);
  return Rx.Observable.create(function(observer) {
    req.pipe(request.put(putUrl, function (err, res, body) {
      if (err) {
        observer.onError(err);
        return;
      };
      // console.log('Put complete:', sketch.url);
      observer.onNext(res.body);
      observer.onCompleted();
    }));
  })
};

module.exports = exports = {
  receiveImage: function(req, res, next) {
    console.log(tag, 'originalUrl', req.originalUrl);
    pod.getRandomPod.flatMap(function(randomPod) {
      // console.log(tag, 'randomPod', randomPod);
      var sketch = {
        containerId: randomPod.id
      , url: randomPod.url
      , uiUrl: '/api/sketch/' + randomPod.id
      , name: req.query.name
      , cuid: req.query.cuid
      , submissionId: req.query.submission_id
      };
      randomPod.skecth = sketch;
      return Rx.Observable.zip(
        saveImageToFile(sketch, req)
      , postImageToPod(sketch, req)
      , function(sketch, response) {
        return sketch;
      })
    })
    .subscribe(function(sketch) {
      console.log(tag, sketch);
      thousandEmitter.emit('new-sketch', sketch);
      res.json(sketch);
    }, function(err) {
      // delete randomPod.skecth;
      // delete randomPod.claimed;
      console.log(tag, err)
      next(err);
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
    randomSketches(numSketches).flatMap(function(sketch) {
      console.log('sketch', sketch)
      return pod.getRandomPod.map(function(randomPod) {
        console.log('pod', randomPod)
        sketch.containerId = randomPod.id
        thousandEmitter.emit('new-sketch', sketch);
        return sketch;
      });
    })
    .subscribe(function(sketch) {
    }, function(error) {
      next(error)
    }, function() {
      console.log(tag, numSketches + ' sketches pushed');
      res.json({msg: numSketches + ' sketches pushed'});
    });
  }
};
