'use strict';

var d3demo = d3demo || {};

d3demo.stomp = (function stompFeed(d3, Rx) {
  var live = Rx.DOM.fromWebSocket(d3demo.config.backend.ws + '/live')
  .retryWhen(function(errors) {
    return errors.delay(5000);
  })
  .map(function(json) {
    return JSON.parse(json.data);
  })
  .filter(function(data) {
    return data.type === 'scan';
  }).map(function(data) {
    return data.data;
  });

  var playback = Rx.DOM.fromWebSocket(d3demo.config.backend.ws + '/playback')
  .retryWhen(function(errors) {
    return errors.delay(5000);
  })
  .map(function(json) {
    return JSON.parse(json.data);
  })
  .filter(function(data) {
    return data.type === 'scan';
  }).map(function(data) {
    return data.data;
  });


  return {
    live: live
  , playback: playback
  }
})(d3, Rx);
