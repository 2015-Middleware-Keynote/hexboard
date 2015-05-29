'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , split = require('split')
  , cc = require('config-multipaas')
  , fs = require('fs')
  , thousandEmitter = require('./thousandEmitter')
  , request = require('request')
  ;

var tag = 'POD';

// Config
var config   = cc().add({
  oauth_token: process.env.ACCESS_TOKEN || false,
  namespace: process.env.NAMESPACE || 'demo1',
  openshift_server: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja:8443'
})

// Allow self-signed SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var url = 'https://' + config.get('openshift_server') + '/api/v1beta3/watch/namespaces/' + config.get('namespace') + '/pods'
var options = {
  'method' : 'get'
 ,'uri'    : url
 ,'qs'     : {}
 ,'rejectUnauthorized': false
 ,'strictSSL': false
 ,'auth'   : {'bearer': config.get('oauth_token') }
}

function podIdToURL(id){
  return "sketch-"+id+"-app-summit3.apps.summit.paas.ninja"
}

var idMap = {};
var lastId = 0;

function podNumber(name){
  var num = name.match(/[a-z0-9]*$/);
  var stringId = num[0];
  if (! idMap[stringId]) {
    idMap[stringId] = ++lastId;
  }
  return idMap[stringId];
}

function verifyPodAvailable(pod, retries_remaining){
  //verify that the app is responding to web requests
  //retry up to N times
  console.log("live: " + pod.data.name);
  thousandEmitter.emit('pod-event', pod.data);
}

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
}



  // stream.pipe(fs.createWriteStream('./server/thousand/pods-create-raw.log'))
  // var writeStream = fs.createWriteStream('./server/thousand/pods-create-parsed.log');

var lastResourceVersion;
var connect = Rx.Observable.create(function(observer) {
  console.log('options', options);
  var stream = request(options);
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
      options.qs.resourceVersion = lastResourceVersion; // get only updates
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

module.exports = {
  rawStream: liveStream
, eventStream: parsedStream
, parseData : parseData
};
