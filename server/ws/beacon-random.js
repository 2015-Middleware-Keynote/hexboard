'use strict';

var WebSocketServer = require('ws').Server
  , data = require('../randomscans')
  ;

module.exports = function(server) {
  var wssRandom = new WebSocketServer({server: server, path: '/random'});

  wssRandom.on('connection', function connection(ws) {
    console.log('/random connection');
    var clock, scans;
    data.reset();
    var subscription = data.scans.subscribe(function(scan) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({type: 'scan', data: scan}));
      };
    }, null, function() {
      if (ws.readyState === ws.OPEN) {
        console.log('Playback complete, closing connection');
        ws.close();
      };
    });
    ws.onclose = function() {
      console.log('Onclose: disposing /random subscriptions');
      subscription.dispose();
    }
  });
};
