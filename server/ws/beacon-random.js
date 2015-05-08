'use strict';

var WebSocketServer = require('ws').Server
  , data = require('../beacon-random')
  ;

var tag = 'WS/RANDOM';

module.exports = function(server) {
  var wssRandom = new WebSocketServer({server: server, path: '/random'});

  wssRandom.on('connection', function connection(ws) {
    console.log(tag, '/random connection');
    var clock, scans;
    data.reset();
    var subscription = data.scans.subscribe(function(scan) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({type: 'scan', data: scan}));
      };
    }, null, function() {
      if (ws.readyState === ws.OPEN) {
        console.log(tag, 'Playback complete, closing connection');
        ws.close();
      };
    });
    ws.onclose = function() {
      console.log(tag, 'Onclose: disposing /random subscriptions');
      subscription.dispose();
    }
  });
};
