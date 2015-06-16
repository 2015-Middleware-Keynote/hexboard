'use strict';

var fs = require('fs')
  , os = require('os')
  , Rx = require('rx')
  , RxNode = require('rx-node')
  , randomSketches = require('../../random').randomSketches
  , thousandEmitter = require('../../thousandEmitter')
  , request = require('request')
  , podClaimer = require('../../pod-claimer')
  ;

var tag = 'API/THOUSAND';

var saveImageToFile = function(sketch, req) {
  var filename = 'thousand-sketch' + sketch.containerId + '.png';
  console.log(tag, 'Saving sketch to file:', filename);
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
  console.log(tag, 'PUT sketch to url:', putUrl);
  return Rx.Observable.create(function(observer) {
    if (! sketch.url) {
      sketch.url = 'http://1k.jbosskeynote.com' + sketch.uiUrl;
      observer.onNext({msg: 'No pod url, not PUTting'});
      observer.onCompleted();
      return;
    }
    req.pipe(request.put(putUrl, function (err, res, body) {
      if (err) {
        observer.onError({msg: 'Error PUTting sketch to ' + putUrl});
        return;
      };
      if (res && res.statusCode == 200) {
        // console.log('Put complete:', sketch.url);
        if (sketch.errorCount) {
          console.log(tag, 'PUT Recovery (#', sketch.errorCount, ') for url:', sketch.url);
          delete(sketch.errorCount);
        } else {
          console.log(tag, 'PUT success for url:', sketch.url);
        }
        observer.onNext(res.body);
        observer.onCompleted();
        return;
      } else {
        var msg = res && res.statusCode ? res.statusCode + ': ' : '';
        observer.onError({msg: msg + 'Error PUTting sketch to ' + putUrl});
        return;
      }
    }));
  })
  .retryWhen(function(errors) {
    var maxRetries = 5;
    return errors.scan(0, function(errorCount, err) {
      if (errorCount === 0) {
        console.log(tag, err.msg);
      };
      if (err.code && (err.code === 401 || err.code === 403)) {
        errorCount = maxRetries;
      } else {
        sketch.errorCount = ++errorCount;
      };
      if (errorCount === maxRetries) {
        console.log(tag, 'Error: too many retries', sketch.url);
        sketch.url = 'http://1k.jbosskeynote.com' + sketch.uiUrl;
        delete(sketch.errorCount);
      }
      return errorCount;
    })
    .takeWhile(function(errorCount) {
      return errorCount < maxRetries;
    })
    .flatMap(function(errorCount) {
      return Rx.Observable.timer(errorCount * 250);
    });
  })
  .catch();
};

module.exports = exports = {
  receiveImage: function(req, res, next) {
    // console.log(tag, 'originalUrl', req.originalUrl);
    podClaimer.getRandomPod.flatMap(function(randomPod) {
      // console.log(tag, 'randomPod', randomPod.id);
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
      //console.log(tag, 'new sketch', sketch.url, sketch.cuid);
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
      fs.createReadStream('./server/thousand/api/thousand/censored.png').pipe(fs.createWriteStream(os.tmpdir() + '/' + filename));
      res.send('removed');
    };
  },

  randomSketches: function(req, res, next) {
    var numSketches = req.params.numSketches;
    randomSketches(numSketches).flatMap(function(sketch) {
      return podClaimer.getRandomPod.map(function(randomPod) {
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
