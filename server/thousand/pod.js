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
    openshiftServer: process.env.OPENSHIFT_SERVER_LIVE || 'openshift-master.summit2.paas.ninja:8443'
  },
  preStart: {
    oauthToken: process.env.ACCESS_TOKEN_PRESTART || false,
    namespace: process.env.NAMESPACE_PRESTART || 'demo-test',  //summit2
    openshiftServer: process.env.OPENSHIFT_SERVER_PRESTART || 'openshift-master.summit2.paas.ninja:8443',
    proxy: 'http://1k.jbosskeynote.com'
  }
};

// Allow self-signed SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var buildWatchPodsUrl = function(server, namespace) {
  return 'https://' + server + '/api/v1beta3/watch/namespaces/' + namespace + '/pods';
};

var buildListPodsUrl = function(server, namespace) {
  return 'https://' + server + '/api/v1beta3/namespaces/' + namespace + '/pods';
};

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

options.livePods = _.extend({
  lsithUrl: buildListPodsUrl(config.live.openshiftServer, config.live.namespace)
, watchUrl: buildWatchPodsUrl(config.live.openshiftServer, config.live.namespace)
, auth: {bearer: config.live.oauthToken }
}
, options.base
);

options.preStartPods = _.extend({
  listUrl: buildListPodsUrl(config.preStart.openshiftServer, config.preStart.namespace)
, watchUrl: buildWatchPodsUrl(config.preStart.openshiftServer, config.preStart.namespace)
, auth: {bearer: config.preStart.oauthToken
}}
, options.base
);

var idMapNamespaces = {};
var nextId = {};

function podNumber(namespace, name) {
  if (! idMapNamespaces[namespace]) {
    idMapNamespaces[namespace] = {};
    nextId[namespace] = 0;
  }
  var idMap = idMapNamespaces[namespace];
  var num = name.match(/[a-z0-9]*$/);
  var stringId = num[0];
  if (! (stringId in idMap)) {
    idMap[stringId] = nextId[namespace]++;
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
        if (pod.errorCount) {
          console.log(tag, 'Recovery (#', pod.errorCount, ')', pod.url);
          delete(pod.errorCount);
        }
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
      if (errorCount === 0) {
        console.log(tag, 'Error ', pod.url, ':', err);
      };
      if (err.code && (err.code === 401 || err.code === 403)) {
        return maxRetries;
      };
      pod.errorCount = ++errorCount;
      return errorCount;
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

var parseData = function(update, proxy) {
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
      id: podNumber(update.object.metadata.namespace, replicaName),
      name: replicaName,
      hostname: podName + '-summit3.apps.summit.paas.ninja',
      stage: update.type,
      type: 'event',
      timestamp: update.timestamp,
      creationTimestamp: new Date(update.object.metadata.creationTimestamp)
    }
    if (proxy) {
      update.data.url = config.preStart.proxy + '/' + config.preStart.namespace + '/' + replicaName;
    }
    if (update.type === 'DELETED') {
      update.data.stage = 0;
    } else if (update.object.status.phase === 'Pending' && ! update.object.spec.host) {
      update.data.stage = 1;
    } else if (update.object.status.phase === 'Pending' && update.object.spec.host) {
      update.data.stage = 2;
    } else if (update.object.status.phase === 'Running' && update.object.status.Condition[0].type == 'Ready' && update.object.status.Condition[0].status === 'False') {
      update.data.stage = 3;
    } else if (update.object.status.phase === 'Running' && update.object.status.Condition[0].type == 'Ready' && update.object.status.Condition[0].status === 'True') {
      update.data.stage = 4;
    } else {
      console.log(tag, "New data type found:" + JSON.stringify(update, null, '  '))
    }
  }
  return update;
};

var list = function(options) {
  return Rx.Observable.create(function(observer) {
    console.log(tag, 'options', options);
    var stream = request(options, function(error, response, body) {
      if (error) {
        console.log(tag, 'error:',error);
        observer.onError(error);
      } else if (response && response.statusCode === 200) {
        var json = JSON.parse(body);
        observer.onNext(json);
        observer.onCompleted();
      } else {
        observer.onError({
          code: response.statusCode
        , msg: body
        });
      }
    });
  });
}

var watch = function(options) {
  return Rx.Observable.create(function(observer) {
    console.log(tag, 'options', options);
    var stream = request(options);
    stream.on('error', function(error) {
      console.log(tag, 'error:',error);
      observer.onError(error);
    });
    stream.on('end', function() {
      observer.onError({type: 'end', msg: 'Request terminated.'});
    });
    var lines = stream.pipe(split());
    // setTimeout(function() {
    //   observer.onError({type: 'end', msg: 'Force terminated.'});
    // }, 1500)
    stream.on('response', function(response) {
      if (response.statusCode === 200) {
        console.log(tag, 'Connection success');
        observer.onNext(lines)
      } else {
        response.on('data', function(data) {
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
  })
  .retryWhen(function(errors) {
    return errors.scan(0, function(errorCount, err) {
      console.log(tag, 'Connection error:', err)
      if (err.type && err.type === 'end') {
        console.log(tag, 'Attmepting a re-connect (#' + errorCount + ')');
        if (options.lastResourceVersion) {
          options.qs.resourceVersion = options.lastResourceVersion; // get only updates
        };
        return errorCount + 1;
      } else {
        throw err;
      }
    });
  });
};

var connect = function(options) {
  var listOptions = _.extend({}, options);
  listOptions.url = options.listUrl;
  var watchOptions = _.extend({}, options);
  watchOptions.url = options.watchUrl;
  return list(listOptions)
    .flatMap(function(pods) {
      if (pods.length) {
        var last = pods[pods.length - 1]
        console.log(last);
        watchOptions.qs.latestResourceVersion = last.object.metadata.resourceVersion;
      }
      return Rx.Observable.merge(
        Rx.Observable.fromArray(pods)
      , watch(watchOptions)
      )
    });
};

var watchStream = function(options) {
  return connect(options).flatMap(function(stream) {
    return RxNode.fromStream(stream)
  })
  .map(function(data) {
    try {
      var json = JSON.parse(data);
      if (json.object.metadata.resourceVersion) {
        options.lastResourceVersion = json.object.metadata.resourceVersion;
      }
      json.timestamp = new Date();
      return json;
    } catch(e) {
      console.log(tag, 'JSON parsing error:', e);
      console.log(data);
      return null;
    }
  })
  .filter(function(json) {
    return json;
  })
  .share();
};

var liveWatchStream = watchStream(options.livePods);
var preStartWatchStream = watchStream(options.preStartPods);

var parsedLiveStream = liveWatchStream.map(function(json) {
  return parseData(json, false);
})
.filter(function(parsed) {
  return parsed && parsed.data && parsed.data.type && parsed.data.id <= 1025;
})
.replay();

parsedLiveStream.connect();

var parsedPreStartStream = preStartWatchStream.map(function(json) {
  return parseData(json, true);
})
.filter(function(parsed) {
  return parsed && parsed.data && parsed.data.type && parsed.data.id <= 1025;
});

var availablePreStartStream = parsedPreStartStream.flatMap(function(parsed) {
  if (parsed.data.stage < 4) {
    return Rx.Observable.just(parsed);
  } else {
    return Rx.Observable.merge(
      Rx.Observable.just(parsed)
    , verifyPodAvailable(parsed.data).map(function() {
        var newParsed = _.clone(parsed)
        newParsed.data = _.clone(parsed.data);
        newParsed.data.stage = 5;
        return newParsed;
      })
    );
  };
}).replay();

availablePreStartStream.connect();

var getActivePreStartPods = availablePreStartStream.filter(function(parsed) {
  return parsed.data.stage === 5;
})
.map(function(parsed) {
  return parsed.data;
}).share()
// .tap(function(pod) {
//   console.log('Available:', pod.url);
// })
;

var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var getRandomPod = getActivePreStartPods.filter(function(pod) {
  return ! pod.claimed;
})
.buffer(getActivePreStartPods.debounce(5))
.take(1)
.map(function(pods) {
  var index = getRandomInt(0, pods.length);
  var pod = pods[index];
  pod.claimed = true;
  return pod;
});

module.exports = {
  rawLiveStream: liveWatchStream
, rawPreStartStream: preStartWatchStream
, liveStream: parsedLiveStream
, preStartStream: availablePreStartStream
, parseData : parseData
, getRandomPod: getRandomPod
};
