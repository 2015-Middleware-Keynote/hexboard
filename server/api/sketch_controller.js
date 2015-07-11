'use strict';

var fs = require('fs')
  , os = require('os')
  , Rx = require('rx')
  , RxNode = require('rx-node')
  , thousandEmitter = require('../hexboard/thousandEmitter')
  , request = require('request')
  , hexboard = require('../hexboard/hexboard')
  , http = require('http')
  , config = require('../config')
  , sketcher = require('../hexboard/sketch')
  ;

var tag = 'API/THOUSAND';

var rxWriteFile = Rx.Observable.fromNodeCallback(fs.writeFile);

var saveImageToFile = function(sketch, req) {
  var filename = 'thousand-sketch' + sketch.containerId + '.png';
  console.log(tag, 'Saving sketch to file:', filename);
  return Rx.Observable.create(function(observer) {
    req.on('end', function() {
      // console.log('File save complete:', filename);
      observer.onNext(sketch);
      observer.onCompleted();
    });
    req.on('error', function(error) {
      observer.onError(error);
    });
    var stream = req.pipe(fs.createWriteStream(os.tmpdir() + '/' + filename));
  });
}

var sketchPostAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 40
});

var postImageToPod = function(sketch, req) {
  if (!sketch.url) {
    console.log(tag, 'POST disabled for this sketch', sketch.uiUrl);
    sketch.url = sketch.pageUrl;
    return Rx.Observable.return(sketch);
  }
  var postUrl = 'http://' + sketch.pod.ip + ':' + sketch.pod.port + '/doodle?username='+sketch.name+'&cuid='+sketch.cuid+'&submission='+sketch.submissionId;
  console.log(tag, 'POST sketch to url:', postUrl);
  return Rx.Observable.create(function(observer) {
    if (! sketch.url) {
      sketch.url = sketch.pageUrl;
      observer.onNext({msg: 'No pod url, not POSTting'});
      observer.onCompleted();
      return;
    }
    req.pipe(request.post({
      url: postUrl,
      timeout: 4000,
      pool: sketchPostAgent
    }, function (err, res, body) {
      if (err) {
        observer.onError({msg: 'Error POSTting sketch to ' + postUrl});
        return;
      };
      if (res && res.statusCode == 200) {
        // console.log('Post complete:', sketch.url);
        if (sketch.errorCount) {
          console.log(tag, 'POST Recovery (#', sketch.errorCount, ') for url:', sketch.url);
          delete(sketch.errorCount);
        } else {
          console.log(tag, 'POST success for url:', sketch.url);
        }
        observer.onNext(res.body);
        observer.onCompleted();
        return;
      } else {
        var msg = res && res.statusCode ? res.statusCode + ': ' : '';
        observer.onError({msg: msg + 'Error POSTting sketch to ' + postUrl});
        return;
      }
    }));
  })
  .retryWhen(function(errors) {
    var maxRetries = 3;
    return errors.scan(0, function(errorCount, err) {
      if (errorCount === 0) {
        console.log(tag, err.msg);
      };
      if (err.code && (err.code === 401 || err.code === 403)) {
        console.log(tag, err.code, 'Error', sketch.url);
        errorCount = maxRetries;
        sketch.url = sketch.pageUrl;
        delete(sketch.errorCount);
      } else {
        sketch.errorCount = ++errorCount;
        if (errorCount === maxRetries) {
          var msg = 'Error: too many retries: ' + sketch.url
          console.log(tag, msg);
          sketch.url = sketch.pageUrl;
          delete(sketch.errorCount);
          throw new Error(msg);
        }
      }
      return errorCount;
    })
    .flatMap(function(errorCount) {
      return Rx.Observable.timer(errorCount * 250);
    });
  })
  .catch(Rx.Observable.return(sketch));
};

module.exports = exports = {
  receiveImage: function(req, res, next) {
    var sketch = {
      name: req.query.name
    , cuid: req.query.cuid
    , submissionId: req.query.submission_id
    };
    hexboard.claimHexagon(sketch);
    sketch.url = sketch.pod ? sketch.pod.url : null;
    sketch.uiUrl = '/api/sketch/' + sketch.containerId + '/image.png?ts=' + new Date().getTime()
    sketch.pageUrl = 'http://1k.jbosskeynote.com/api/sketch/' + sketch.containerId + '/page.html'
    Rx.Observable.return(sketch)
    .flatMap(function(sketch) {
      return Rx.Observable.forkJoin(
        saveImageToFile(sketch, req)
      , postImageToPod(sketch, req)
      ).map(function(arr) {
        return arr[0]
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
    res.sendFile(os.tmpdir() + '/' + filename);
  },

  getImagePage: function(req, res, next) {
    var containerId = parseInt(req.params.containerId);
    var filename = 'thousand-sketch' + containerId + '-index.html';
    res.sendFile(os.tmpdir() + '/' + filename);
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
    Rx.Observable.range(0, numSketches).map(function(index) {
      sketcher.postRandomImage(config.get('HOSTNAME') + ':' + config.get('PORT'));
    })
    .subscribe(function() {
    }, function(error) {
      next(error)
    }, function() {
      console.log(tag, numSketches + ' sketches pushed');
      res.json({msg: numSketches + ' sketches pushed'});
    });
  }
};
