'use strict';

var d3demo = d3demo || {};

d3demo.random = (function dataSimulator(d3, Rx) {
  var START_MINUTES = 7*60 + 50
    , END_MINUTES = 18*60;

  var EVENT_DATE = new Date('2015-06-23').getTime() + 7 * 60 * 60 * 1000;

  var users = [];
  // initialize the users
  for (var i = 0; i < 200; i++) {
    users.push({
      id: i
    , name: i === 13 ? 'Burr Sutter' : 'Firstname' + i + ' Lastname' + i
    });
  };

  var playbackSocket = function(cb) {
    var rxSocket = Rx.DOM.fromWebSocket(
      'ws://localhost:9000'
    ).map(function(json) {
      return JSON.parse(json.data);
    }).share();

    // rxSocket.subscribe(function(tick) {
    //   console.log(tick);
    // })

    var clock = rxSocket.filter(function(data) {
      return data.type === 'tick';
    }).map(function(data) {
      return data.data;
    });


    var scans = rxSocket.filter(function(data) {
      return data.type === 'scan';
    }).map(function(data) {
      return data.data;
    });

    cb(clock, scans);
  }

  return {
    eventTimeStamp: EVENT_DATE + START_MINUTES * 60 * 1000
  , users: users
  , playback: playbackSocket
  }
})(d3, Rx);
