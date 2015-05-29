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
    namespace: process.env.NAMESPACE_LIVE || 'demo2',
    openshiftServer: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja:8443'
  },
  preStart: {
    oauthToken: process.env.ACCESS_TOKEN_PRESTART || false,
    namespace: process.env.NAMESPACE_PRESTART || 'demo3',
    openshiftServer: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja:8443'
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

function verifyPodAvailable(pod, retries_remaining) {
  //verify that the app is responding to web requests
  //retry up to N times
  console.log("live: " + pod.data.name);
  thousandEmitter.emit('pod-event', pod.data);
};

var parseData = function(update) {
  var podName = update.object.spec.containers[0].name;
  if (podName.indexOf('sketch') !== 0 || !update.object.status || !update.object.status.phase) {
    // console.log('Ignoring update for container name:', update.object.spec.containers[0].name);
  } else {
    var replicaName = update.object.metadata.name;
    //bundle the pod data
    // console.log('name',update.object.spec.containers[0].name, update.object.metadata.name)
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
      console.log("New data type found:" + JSON.stringify(update, null, '  '))
    }
  }
  return update;
};



  // stream.pipe(fs.createWriteStream('./server/thousand/pods-create-raw.log'))
  // var writeStream = fs.createWriteStream('./server/thousand/pods-create-parsed.log');

var lastResourceVersion;
var connect = Rx.Observable.create(function(observer) {
  console.log('options', options.watchLivePods);
  var stream = request(options.watchLivePods);
  var lines = stream.pipe(split());
  stream.on('response', function(response) {
    if (response.statusCode === 200) {
      console.log('Connection success');
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
        console.log(error);
        observer.onError(error);
      });
    }
  });
  stream.on('error', function(error) {
    console.log('error:',error);
    observer.onError(error);
  });
  stream.on('end', function() {
    console.log('request terminated, retrying');
    observer.onError('retry');
  });
})
.retryWhen(function(errors) {
  return errors.scan(0, function(errorCount, err) {
    console.log('Connection error:', err)
    if (err === 'retry') {
      options.watchLivePods.qs.resourceVersion = lastResourceVersion; // get only updates
      return true;
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
    console.log('JSON parsing error:', e);
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
  console.log('options', options.listPreStartPods);
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
    console.log('Error:', err);
    if (err.code && err.code === 403) {
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
  // console.log(object);
  return (object.status.phase === 'Running' && object.status.Condition[0].type == 'Ready' && object.status.Condition[0].status === 'True')
});

var getFromPod = function(podName) {
  // /api/v1beta3/proxy/namespaces/{namespaces}/pods/{name}
  var localurl = 'https://' + config.preStart.openshiftServer + '/api/v1beta3/namespaces/demo3/pods/'+ podName +'/proxy/';
  // var localurl = 'https://' + config.preStart.openshiftServer + '/api/v1beta3/proxy/namespaces/demo3/pods/' + podName;
  var localoptions = _.extend({url: localurl, auth: {bearer: config.preStart.oauthToken }}, options.base);
  console.log('options', localoptions);
  request(localoptions, function(error, response, body) {
    console.log(error);
    // console.log(response);
    console.log(body);
  });
};


module.exports = {
  rawStream: liveStream
, eventStream: parsedStream
, parseData : parseData
, getActivePreStartPods: getActivePreStartPods
, getFromPod: getFromPod
};
