'use strict';

var WebSocketServer = require('ws').Server
  , stomp = require('../stompscans')
  , Scan = require('../api/scan/scan_model')
  ;

module.exports = function(server) {
  var wssLive = new WebSocketServer({server: server, path: '/live'});

  var count = 0;
  var clients = {};

  wssLive.broadcast = function broadcast(data) {
    for (var i in clients) {
      var ws = clients[i];
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      } else if (ws.readyState === ws.CLOSED) {
        console.log('Peer #' + ws.id + ' disconnected from /live.');
        delete clients[ws.id];
      }
    };
  };

  wssLive.on('connection', function connection(wsLive) {
    var id = count++;
    clients[id] = wsLive;
    wsLive.id = id;
    console.log('Peer #' + id + ' connected to /live.');
  });

  var saveScan = function(scan) {
    Scan.create({
      beaconId: scan.beaconId
    , location: scan.location.code
    , type: scan.type
    , timestamp: scan.timestamp
    }).then(function (createdScan) {
      // console.log('Saved scan for beacon: ', createdScan.beaconId);
      // process.stdout.write('.');
      return;
    }, function(error) {
      console.log('Error saving scan: ', error);
    });
  }

  stomp.scans.subscribe(function(scan) {
    // console.log('user', scan.user.name, 'location', scan.location.name);
    saveScan(scan);
    wssLive.broadcast(JSON.stringify({type: 'scan', data: scan}));
  });
}
