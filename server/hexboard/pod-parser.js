'use strict';

var Rx = require('rx')
  , RxNode = require('rx-node')
  , config = require('../config')
  , _ = require('underscore')
  , hexboard = require('./hexboard')
  ;

var tag = 'PODSTREAMS';

var getRandomInt = function (min, max) {
  return Math.floor(Math.random() * (max - min) + min);
};

var PodParser = function() {

  var idMap = {};
  var availableIds = _.range(hexboard.layout.count);

  var takeRandomId = function() {
    var index = getRandomInt(0, availableIds.length);
    var id = availableIds[index];
    availableIds.splice(index,1);
    return id;
  };

  var extractId = function(podName) {
    var num = podName.match(/[a-z0-9]*$/);
    var stringId = num[0];
    return stringId;
  }

  var returnIdToPool = function(pod) {
    delete idMap[extractId(pod.object.metadata.name)];
    availableIds.push(pod.data.id);
  };

  function podNumber(name) {
    var stringId = extractId(name)
    if (! (stringId in idMap)) {
      idMap[stringId] = takeRandomId();
    }
    return idMap[stringId];
  };

  var parseData = function(update) {
    if (! (update && update.object && update.object.spec && update.object.spec.containers && update.object.spec.containers.length > 0)) {
      return update;
    };
    var podName = update.object.spec.containers[0].name;
    if (   podName.search('hexboard') !== -1
       || podName.search('build')    !== -1
       || podName.search('deploy')   !== -1
       || !update.object.status
       || !update.object.status.phase )
    {
      console.log(tag, 'Ignoring update for container name:', update.object.spec.containers[0].name);
    } else {
      var replicaName = update.object.metadata.name;
      //bundle the pod data
      // console.log(tag, 'name',update.object.spec.containers[0].name, update.object.metadata.name)
      update.data = {
        id: podNumber(replicaName),
        name: replicaName,
        hostname: podName + '-summit3.apps.summit.paas.ninja',
        stage: update.type,
        type: 'event',
        timestamp: update.timestamp,
        creationTimestamp: new Date(update.object.metadata.creationTimestamp)
      }
      if (update.type === 'DELETED') {
        returnIdToPool(update);
        update.data.stage = 0;
      } else if (update.object.status.phase === 'Failed' ) {
        returnIdToPool(update);
        update.data.stage = 0;
      } else if (update.object.status.phase === 'Pending' && ! update.object.spec.nodeName ) {
        update.data.stage = 1;
      } else if (update.object.status.phase === 'Pending' && update.object.spec.nodeName ) {
        update.data.stage = 2;
      } else if (update.object.status.phase === 'Running' && update.object.status.conditions[0].type == 'Ready' && update.object.status.conditions[0].status === 'False') {
        update.data.stage = 3;
      } else if (update.object.status.phase === 'Running' && update.object.status.conditions[0].type == 'Ready' && update.object.status.conditions[0].status === 'True') {
        update.data.ip = update.object.status.podIP;
        update.data.port = 8080;
        // Construct a route to the back-end service
        if(config.get('PROXY')){
          update.data.url = "http://" + config.get('PROXY') + '/direct/' + update.data.ip + '/';
        }else{
          update.data.url = '/direct/' + update.data.ip + '/';
        }
        console.log(update.data.url)
        update.data.stage = 4;
      } else {
        console.log(tag, "New data type found:" + JSON.stringify(update, null, '  '))
      }
    }
    return update;
  };
  return {
    returnIdToPool: returnIdToPool
  , parseData: parseData
  }
}

module.exports = PodParser;
