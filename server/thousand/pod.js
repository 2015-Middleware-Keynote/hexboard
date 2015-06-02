'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , split = require('split')
  , cc = require('config-multipaas')
  , fs = require('fs')
  , thousandEmitter = require('./thousandEmitter')
  , request = require('request')
  , _ = require('underscore')
  ;

var tag = 'POD';

// Config
var config = {
  live: {
    oauthToken: process.env.ACCESS_TOKEN_LIVE || false,
    namespace: process.env.NAMESPACE_LIVE || 'demo1', //summit1
    openshiftServer: process.env.OPENSHIFT_SERVER || 'openshift-master.summit2.paas.ninja:8443'
  },
  preStart: {
    oauthToken: process.env.ACCESS_TOKEN_PRESTART || false,
    namespace: process.env.NAMESPACE_PRESTART || 'demo-test',  //summit2
    openshiftServer: process.env.OPENSHIFT_SERVER || 'openshift-master.summit2.paas.ninja:8443',
    proxy: 'http://openshiftproxy-bleathemredhat.rhcloud.com'
  }
};

// Allow self-signed SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var url = {
  watchLivePods: 'https://' + config.live.openshiftServer + '/api/v1beta3/watch/namespaces/' + config.live.namespace + '/pods',
  listPreStartPods: 'https://' + config.preStart.openshiftServer + '/api/v1beta3/namespaces/' + config.preStart.namespace + '/pods'
}

var options = {
  base: {
    'method' : 'get'
  //  ,'url'    : null
   ,'qs'     : {}
   ,'rejectUnauthorized': false
   ,'strictSSL': false
  //  ,'auth'   : null
  }
};

options.watchLivePods = _.extend({url: url.watchLivePods, auth: {bearer: config.live.oauthToken }}, options.base);
options.listPreStartPods = _.extend({url: url.listPreStartPods, auth: {bearer: config.preStart.oauthToken }}, options.base);

function podIdToURL(id) {
  return "sketch-"+id+"-app-summit3.apps.summit.paas.ninja"
};

var idMap = {};
var lastId = 0;

function podNumber(name) {
  var num = name.match(/[a-z0-9]*$/);
  var stringId = num[0];
  if (! idMap[stringId]) {
    idMap[stringId] = ++lastId;
  }
  return idMap[stringId];
};

function verifyPodAvailable(pod) {
  return Rx.Observable.create(function(observer) {
    var options = {
      url: pod.url
    , method: 'get'
    }
    request(options, function(error, response, body) {
      if (!error && response.statusCode == 200) {
        observer.onNext(pod);
        observer.onCompleted();
      } else {
        var err = {
          code: response.statusCode
        , msg: error
        }
        observer.onError(err);
      };
    })
  })
  .retryWhen(function(errors) {
    var maxRetries = 20;
    return errors.scan(0, function(errorCount, err) {
      console.log(tag, 'Error (#', errorCount, ')', pod.url, ':', err);
      if (err.code && (err.code === 401 || err.code === 403)) {
        return maxRetries;
      };
      return errorCount + 1;
    })
    .takeWhile(function(errorCount) {
      return errorCount < maxRetries;
    })
    .flatMap(function(errorCount) {
      return Rx.Observable.timer(errorCount * 250);
    });
  })
  .catch(Rx.Observable.empty());
};

var parseData = function(update) {
  if (! (update && update.object && update.object.spec && update.object.spec.containers && update.object.spec.containers.length > 0)) {
    return update;
  };
  var podName = update.object.spec.containers[0].name;
  if (podName.indexOf('sketch') !== 0 || !update.object.status || !update.object.status.phase) {
    // console.log(tag, 'Ignoring update for container name:', update.object.spec.containers[0].name);
  } else {
    var replicaName = update.object.metadata.name;
    //bundle the pod data
    // console.log(tag, 'name',update.object.spec.containers[0].name, update.object.metadata.name)
    update.data = {
      id: podNumber(replicaName),
      name: podName,
      hostname: podName + '-summit3.apps.summit.paas.ninja',
      stage: update.type,
      type: 'event',
      timestamp: update.timestamp,
      creationTimestamp: new Date(update.object.metadata.creationTimestamp)
    }
    if (update.object.status.phase === 'Pending' && ! update.object.spec.host) {
      update.data.stage = 1;
    }
    else if (update.object.status.phase === 'Pending' && update.object.spec.host) {
      update.data.stage = 2;
    }
    else if (update.object.status.phase === 'Running' && update.object.status.Condition[0].type == 'Ready' && update.object.status.Condition[0].status === 'False') {
      update.data.stage = 3;
    }
    else if (update.object.status.phase === 'Running' && update.object.status.Condition[0].type == 'Ready' && update.object.status.Condition[0].status === 'True') {
      update.data.stage = 4;
    } else {
      console.log(tag, "New data type found:" + JSON.stringify(update, null, '  '))
    }
  }
  return update;
};



  // stream.pipe(fs.createWriteStream('./server/thousand/pods-create-raw.log'))
  // var writeStream = fs.createWriteStream('./server/thousand/pods-create-parsed.log');

var lastResourceVersion;
var connect = Rx.Observable.create(function(observer) {
  console.log(tag, 'options', options.watchLivePods);
  var stream = request(options.watchLivePods);
  var lines = stream; //.pipe(split());
  stream.on('response', function(response) {
    if (response.statusCode === 200) {
      console.log(tag, 'Connection success');
      observer.onNext(lines)
    } else {
      stream.on('data', function(data) {
        var message;
        try {
          var data = JSON.parse(data);
          message = data.message;
        } catch(e) {
          message = data.toString();
        }
        var error = {
          code: response.statusCode
        , message: message
        };
        if (error.code === 401 || error.code === 403) {
          error.type = 'auth';
        };
        console.log(tag, error);
        observer.onError(error);
      });
    };
  });
  stream.on('error', function(error) {
    console.log(tag, 'error:',error);
    observer.onError(error);
  });
  stream.on('end', function() {
    observer.onError({type: 'end', msg: 'Request terminated.'});
  });
})
.retryWhen(function(errors) {
  return errors.scan(0, function(errorCount, err) {
    console.log(tag, 'Connection error:', err)
    if (err.type && err.type === 'end') {
      console.log(tag, 'Attmepting a re-connect (#' + errorCount + ')');
      options.watchLivePods.qs.resourceVersion = lastResourceVersion; // get only updates
      return errorCount + 1;
    } else {
      throw err;
    }
  });
})
.shareReplay(1);

var liveStream = connect.flatMap(function(stream) {
  return RxNode.fromStream(stream)
})
.map(function(data) {
  try {
    var json = JSON.parse(data);
    lastResourceVersion = json.object.metadata.resourceVersion;
    json.timestamp = new Date();
    return json;
  } catch(e) {
    console.log(tag, 'JSON parsing error:', e);
    return null;
  }
})
.filter(function(json) {
  return json;
})
.shareReplay();

var parsedStream = liveStream.map(function(json) {
  return parseData(json);
})
.filter(function(parsed) {
  return parsed && parsed.data && parsed.data.stage && parsed.data.id <= 1025;
});

var getActivePreStartPods = Rx.Observable.create(function(observer) {
  console.log(tag, 'options', options.listPreStartPods);
  request(options.listPreStartPods, function(error, response, body) {
    if (error) {
      observer.onError({
        msg: error
      });
    };
    if (response.statusCode === 200) {
      try {
        var json = JSON.parse(body);
        if (json.kind === 'PodList') {
          observer.onNext(json.items);
          observer.onCompleted();
        } else {
          observer.onError({
            msg: 'Returned value wasn\'t a PodList',
            data: json
          });
        };
      } catch(e) {
        observer.onError({
          msg: e
        });
      }
    } else {
      observer.onError({
        code: response.statusCode,
        msg: body
      });
    };
  });
})
.retryWhen(function(errors) {
  var maxRetries = 5;
  return errors.scan(0, function(errorCount, err) {
    console.log(tag, 'Error:', err);
    if (err.code && (err.code === 401 || err.code === 403)) {
      return maxRetries;
    };
    return errorCount + 1;
  })
  .takeWhile(function(errorCount) {
    return errorCount < maxRetries;
  })
  .delay(200);
})
.flatMap(function(items) {
  return items;
})
.filter(function(object) {
  // console.log(tag, object);
  return (object.status.phase === 'Running' && object.status.Condition[0].type == 'Ready' && object.status.Condition[0].status === 'True')
})
.map(function(object, index) {
  var pod = {
    index: index
  , name: object.metadata.name
  , url: config.preStart.proxy + '/' + config.preStart.namespace + '/' + object.metadata.name
  }
  return pod;
})
.flatMap(function(pod) {
  return verifyPodAvailable(pod);
})
.tap(function(pod) {
  console.log('Available:', pod.url);
})
.replay();

getActivePreStartPods.connect();

// getActivePreStartPods.take(1).subscribeOnError(function(err) {console.log(tag, err)});

var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var ids = _.range(0, 1025);
var getRandomPod = getActivePreStartPods.filter(function(pod) {
    return ! pod.id;
  })
  .take(1)
  .map(function(pod) {
    var index = getRandomInt(0, ids.length);
    var id = ids[index];
    ids.splice(index, 1);
    pod.id = id;
    return pod;
  });

module.exports = {
  rawStream: liveStream
, eventStream: parsedStream
, parseData : parseData
, getRandomPod: getRandomPod
};
