'use strict';

var WebSocketServer = require('ws').Server
  , live = require('../beacon-live')
  , restoreScans = require('../restorescans').restoreScans
  ;

var tag = 'WS/LIVE';

module.exports = function(server) {
  var wss = new WebSocketServer({server: server, path: '/live'});

  var count = 0;
  var clients = {};

  wss.broadcast = function broadcast(data) {
    for (var i in clients) {
      var ws = clients[i];
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      } else if (ws.readyState === ws.CLOSED) {
        console.log(tag, 'Peer #' + ws.id + ' disconnected from /live.');
        delete clients[ws.id];
      }
    };
  };

  wss.on('connection', function connection(ws) {
    var id = count++;
    clients[id] = ws;
    ws.id = id;
    restoreScans().then(function(scans) {
      // ws.send('hello');
      console.log(tag, 'Restoring', scans.length, 'scans');
      scans.forEach(function(scan) {
        clients[id].send(JSON.stringify({type: 'scan', data: scan}));
      })
    }, function(err) {
      console.err(tag, err);
    })
    console.log(tag, 'Peer #' + id + ' connected to /live.');
  });

  live.scanFeed.tap(function(scan) {
    wss.broadcast(JSON.stringify({type: 'scan', data: scan}));
  }).subscribeOnError(function(err) {
    console.log(err.stack || err);
  });
}
