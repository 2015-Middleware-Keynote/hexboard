'use strict';

var WebSocketServer = require('ws').Server
  , data = require('../beacon-random')
  , Rx = require('rx')
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
    var send = Rx.Observable.fromNodeCallback(ws.send, ws);
    var subscription = scans
      .bufferWithTimeOrCount(20, 100)
      .filter(function(buf) {
        return buf.length > 0;
      })
      .flatMap(function(scanBundle) {
        if (ws.readyState === ws.OPEN) {
          return send(JSON.stringify({type: 'scanBundle', data: scanBundle}));
        };
      })
      .subscribe(undefined, function(error) {
        console.error(error.stack || error);
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
