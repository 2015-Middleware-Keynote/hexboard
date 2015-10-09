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
  , base64 = require('base64-stream')
  , through = require('through2')
  , uuid = require('uuid-js');
  ;

var tag = 'API/THOUSAND';

var indexFile = fs.readFileSync(__dirname + '/../../static/pod/index.html', {encoding: 'utf8'});
var rxWriteFile = Rx.Observable.fromNodeCallback(fs.writeFile);

var saveIndexFile = function(sketch) {
  var html = indexFile.toString()
             .replace( /\{\{SUBMISSION\}\}/, sketch.submissionId)
             .replace( /\{\{USERNAME\}\}/, sketch.name)
             .replace( /\{\{CUID\}\}/, sketch.cuid)
             .replace( /\{\{DOODLE\}\}/, sketch.uiUrl);
  var filename = 'thousand-sketch' + sketch.containerId + '-index.html';
  return rxWriteFile(os.tmpdir() + '/' + filename, html)
    .map(function() {
      return sketch;
    });
}

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
};

var sketchPostAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 40
});

var postImageToPod = function(sketch, req) {
  if (!sketch.podUrl) {
    console.log(tag, 'POST disabled for this sketch', sketch.uiUrl);
    sketch.url = sketch.pageUrl;
    return Rx.Observable.return(sketch);
  }
  var postUrl = sketch.podUrl + '/doodle?username='+sketch.name+'&cuid='+sketch.cuid+'&submission='+sketch.submissionId;
  console.log(tag, 'POST sketch to url:', postUrl);
  return Rx.Observable.create(function(observer) {
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
        if (sketch.errorCount) {
          console.log(tag, 'POST Recovery (#', sketch.errorCount, ') for url:', postUrl);
          delete(sketch.errorCount);
        } else {
          console.log(tag, 'POST success for url:', postUrl);
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
    var maxRetries = 30;
    return errors.scan(0, function(errorCount, err) {
      if (errorCount === 0) {
        console.log(tag, err.msg);
      };
      if (err.code && (err.code === 401 || err.code === 403)) {
        console.log(tag, err.code, 'Error', postUrl);
        errorCount = maxRetries;
        sketch.url = sketch.pageUrl;
        delete(sketch.errorCount);
      } else {
        sketch.errorCount = ++errorCount;
        if (errorCount === maxRetries) {
          var msg = 'Error: too many retries: ' + postUrl
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

var parseSketchStream = function(req) {
  var passthrough = false;
  var accumulation = '';
  var stream = req
    .pipe(through(function (chunk, enc, callback) {
      if (!passthrough) {
        accumulation += chunk;
        var test = 'image/png;base64,';
        var index = accumulation.indexOf(test);
        if (index > - 1) {
          passthrough = true;
          chunk = accumulation.substr(index + test.length);
        }
      }
      if (passthrough) {
        this.push(chunk);
      }
      callback();
    }))
    .pipe(base64.decode());
  return stream;
}

var parseSketch = function(req) {
  var uid = uuid.create().toString();
  var sketch = {
    name: req.query.name
  , cuid: uid
  , submissionId: uid
  };
  var stream = parseSketchStream(req);
  hexboard.claimHexagon(sketch);
  if (sketch.pod && sketch.pod.url) {  // config.get('PROXY') == ''
    console.log(tag, 'pod.url', sketch.pod.url);
    if (sketch.pod.url.indexOf('/') === 0) {
      sketch.externalUrl = 'http://' + req.get('Host') + sketch.pod.url;
      sketch.podUrl = 'http://' + sketch.pod.ip + ':' + sketch.pod.port;
    } else {
      sketch.externalUrl = sketch.pod.url;
      sketch.podUrl = sketch.pod.url;
    }
    console.log(tag, 'sketch.podUrl', sketch.pod.url);
    sketch.url = sketch.externalUrl;
  };
  sketch.uiUrl = '/api/sketch/' + sketch.containerId + '/image.png?ts=' + new Date().getTime();
  sketch.pageUrl = 'http://' + req.get('Host') + '/api/sketch/' + sketch.containerId + '/page.html';
  return Rx.Observable.return(sketch)
  .flatMap(function(sketch) {
    return Rx.Observable.forkJoin(
      saveImageToFile(sketch, stream)
    , saveIndexFile(sketch)
    , postImageToPod(sketch, stream)
    ).map(function(arr) {
      return arr[0]
    })
  });
};

module.exports = exports = {
  receiveImage: function(req, res, next) {
    parseSketch(req).subscribe(function(sketch) {
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
