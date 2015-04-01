'use strict';

var d3demo = d3demo || {};

d3demo.stomp = (function stompFeed(d3, Rx) {
  var scans = Rx.DOM.fromWebSocket(d3demo.config.backend.ws + '/live')
  .map(function(json) {
    return JSON.parse(json.data);
  })
  .filter(function(data) {
    return data.type === 'scan';
  }).map(function(data) {
    return data.data;
  });

  return {
    scans: scans
  }
})(d3, Rx);
