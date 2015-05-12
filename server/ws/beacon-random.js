'use strict';

var WebSocketServer = require('ws').Server
  , data = require('../beacon-random')
  ;

var tag = 'WS/RANDOM';

module.exports = function(server) {
  var wss = new WebSocketServer({server: server, path: '/random'});

  wss.on('connection', function connection(ws) {
    console.log(tag, '/random connection');
    data.reset();
    var scans = data.scans.share();
    scans.take(1).subscribe(function(scan) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({type: 'setup', data: {
          startTime: data.startTimestamp,
          endTime: data.endTimestamp
        }}));
      };
    });
    var subscription = scans
    .bufferWithTime(20)
    .subscribe(function(scanBundle) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({type: 'scanBundle', data: scanBundle}));
      };
    }, function(error) {
      console.log(error.stack || error);
    }, function() {
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
