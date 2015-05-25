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

var url = 'https://' + config.get('openshift_server') + '/api/v1beta2/watch/pods'
var options = {
  'method' : 'get'
 ,'uri'    : url
 ,'qs'     : {'namespace': config.get('namespace')}
 ,'rejectUnauthorized': false
 ,'strictSSL': false
 ,'auth'   : {'bearer': config.get('oauth_token') }
}

function podIdToURL(id){
  return "doodle-"+id+"-app-summit3.apps.summit.paas.ninja"
}

function podId(pod){
  return pod.object.desiredState.manifest.containers[0].name
}
function podNumber(pod){
  var num = pod.object.desiredState.manifest.containers[0].name.match(/[0-9][0-9]*/)
  return num[0]
}
function verifyPodAvailable(pod, retries_remaining){
  //verify that the app is responding to web requests
  //retry up to N times
  console.log("live: " + pod.data.name);
  thousandEmitter.emit('pod-event', pod.data);
}

var parseData = function(update){
  if(update.object.desiredState.manifest.containers[0].name != 'deployment'){
    //bundle the pod data
    update.data = {
      id: podNumber(update),
      name: podId(update),
      hostname: podId(update) + '-summit3.apps.summit.paas.ninja',
      stage: update.type,
      type: 'event',
      creationTimestamp: new Date(update.object.creationTimestamp)
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
  // stream.pipe(fs.createWriteStream('pods-create.log'));
  return RxNode.fromStream(stream.pipe(split()))
  .map(function(data) {
    return parseData(JSON.parse(data));
  }).filter(function(parsed) {
    return parsed && parsed.data && parsed.data.stage;
  }).map(function(parsed) {
    return parsed.data;
  });
};

var podEventFeed = function () {
  if (process.env.ACCESS_TOKEN) {
    console.log('live');
    return getLiveStream();
  } else {
    console.log('replaying');
    logEvents.subscribeOnError(function(err) {
      console.log(err.stack || err);
    });
    replayProgress.subscribeOnError(function(err) {
      console.log(err.stack || err);
    });
    return replay;
  }
};

module.exports = {
  events: podEventFeed
, parseData : parseData
};
