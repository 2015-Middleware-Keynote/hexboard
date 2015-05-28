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
var pod_statuses = []
var submissionCount = 0;

// Config
var config   = cc().add({
  oauth_token: process.env.ACCESS_TOKEN || false,
  namespace: process.env.NAMESPACE || 'demo2',
  openshift_server: process.env.OPENSHIFT_SERVER || 'openshift-master.summit.paas.ninja:8443'
})

// Allow self-signed SSL
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var url = 'https://' + config.get('openshift_server') + '/api/v1beta3/watch/pods'
var options = {
  'method' : 'get'
 ,'uri'    : url
 ,'qs'     : {'namespace': config.get('namespace')}
 ,'rejectUnauthorized': false
 ,'strictSSL': false
 ,'auth'   : {'bearer': config.get('oauth_token') }
}

function podIdToURL(id){
  return "sketch-"+id+"-app-summit3.apps.summit.paas.ninja"
}

function podNumber(name){
  var num = name.match(/[0-9][0-9]*/);
  return num[0];
}
function verifyPodAvailable(pod, retries_remaining){
  //verify that the app is responding to web requests
  //retry up to N times
  console.log("live: " + pod.data.name);
  thousandEmitter.emit('pod-event', pod.data);
}

var parseData = function(update){
  var podName = update.object.spec.containers[0].name;
  if (podName.indexOf('doodle') !== 0) {
    console.log('Ignoring update for container name:', update.object.spec.containers[0].name);
  } else {
    //bundle the pod data
    update.data = {
      id: podNumber(podName),
      name: podName,
      hostname: podName + '-summit3.apps.summit.paas.ninja',
      stage: update.type,
      type: 'event',
      timestamp: new Date(),
      creationTimestamp: new Date(update.object.metadata.creationTimestamp)
    }
    if(update.type == 'ADDED'){
      update.data.stage = 1;
    }
    else if(update.type == 'MODIFIED'){
      update.data.stage = 2;
    }
    else if(update.type == 'DELETED'){
      update.data.stage = 3;
    }else{
      console.log("New data type found:" + JSON.stringify(update))
      //console.log('\n');
      //console.log("update_type: "+update.type)
      //console.log("name: "+update.object.desiredState.manifest.containers[0].name)
      //console.log("status: "+ update.object.status)
      //console.log('\n');
      //console.log("update id:"+update.object.id);
      //console.log("data:"+JSON.stringify(update));
    }
    //persist pod state
    pod_statuses[update.data.id] = update.data
  }
  return update;
}

var getLiveStream = function() {
  console.log('options', options);
  var stream = request(options);
  // stream.pipe(fs.createWriteStream('./server/thousand/pods-create-raw.log'))
  // var writeStream = fs.createWriteStream('./server/thousand/pods-create-parsed.log');

  var response = Rx.Observable.create(function(observer) {
    stream.on('response', function(response) {
      if (response.statusCode === 200) {
        observer.onNext(response.statusCode)
      } else {
        stream.on('data', function(data) {
          var message;
          try {
            var data = JSON.parse(data);
            message = data.message;
          } catch(e) {
            message = data.toString();
          }
          observer.onError({
            code: response.statusCode
          , message: message
          });
        });
      }
    });
    stream.on('error', function(error) {
      console.log('error:',error);
      observer.onError(error);
    });
  })
  // stream.pipe();
  var liveStream = response.flatMap(function() {
    return RxNode.fromStream(stream.pipe(split()))
  })
  .map(function(data) {
    var json = JSON.parse(data);
    // console.log(json);
    try {
      var parsed = parseData(json);
      return parsed;
    } catch (error) {
      console.log('**************** Error', error);
      console.log(JSON.stringify(JSON.parse(data), null, 4));
      throw error;
    }
  })
  // .tap(function(parsed) {
  //   writeStream.write(JSON.stringify(parsed) + '\n');
  // })
  .filter(function(parsed) {
    console.log(parsed.data);
    return parsed && parsed.data && parsed.data.stage;
  })
  .map(function(parsed) {
    return parsed.data;
  });

  return liveStream;
};

module.exports = {
  events: getLiveStream
, parseData : parseData
};
