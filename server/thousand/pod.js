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

options.watchLivePods = _.extend({
  url: buildWatchPodsUrl(config.live.openshiftServer, config.live.namespace)
, auth: {bearer: config.live.oauthToken }
}
, options.base
);

options.watchPreStartPods = _.extend({
  url: buildWatchPodsUrl(config.preStart.openshiftServer, config.preStart.namespace)
, auth: {bearer: config.preStart.oauthToken
}}
, options.base
);

options.listPreStartPods = _.extend({
  url: buildListPodsUrl(config.preStart.openshiftServer, config.preStart.namespace)
, auth: {bearer: config.preStart.oauthToken
}}
, options.base
);

var idMapNamespaces = {};
var lastId = {};

function podNumber(namespace, name) {
  if (! idMapNamespaces[namespace]) {
    idMapNamespaces[namespace] = {};
    lastId[namespace] = 0;
  }
  var idMap = idMapNamespaces[namespace];
  var num = name.match(/[a-z0-9]*$/);
  var stringId = num[0];
  if (! idMap[stringId]) {
    idMap[stringId] = lastId[namespace]++;
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
          console.log(tag, 'Recovery (#', errorCount, ')', pod.url);
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
      id: podNumber(update.object.metadata.namespace, replicaName),
      name: podName,
      hostname: podName + '-summit3.apps.summit.paas.ninja',
      stage: update.type,
      type: 'event',
      timestamp: update.timestamp,
      creationTimestamp: new Date(update.object.metadata.creationTimestamp)
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

var connect = function(options) {
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
  .replay();
};

var liveWatchStream = watchStream(options.watchLivePods);
var preStartWatchStream = watchStream(options.watchPreStartPods);

liveWatchStream.connect();
preStartWatchStream.connect();

var parsedLiveStream = liveWatchStream.map(function(json) {
  return parseData(json);
})
.filter(function(parsed) {
  return parsed && parsed.data && parsed.data.type && parsed.data.id <= 1025;
});

var parsedPreStartStream = preStartWatchStream.map(function(json) {
  return parseData(json);
})
.filter(function(parsed) {
  return parsed && parsed.data && parsed.data.type && parsed.data.id <= 1025;
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
// .tap(function(pod) {
//   console.log('Available:', pod.url);
// })
.replay();

getActivePreStartPods.connect();

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
  rawLiveStream: liveWatchStream
, rawPreStartStream: preStartWatchStream
, liveStream: parsedLiveStream
, preStartStream: parsedPreStartStream
, parseData : parseData
, getRandomPod: getRandomPod
};
