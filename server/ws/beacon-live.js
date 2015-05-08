'use strict';

var WebSocketServer = require('ws').Server
  , live = require('../beacon-live')
  , Scan = require('../api/scan/scan_model')
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

  var saveScan = function(scan) {
    Scan.create({
      beaconId: scan.beaconId
    , location: scan.location.code
    , type: scan.type
    , timestamp: scan.timestamp
    }).then(function (createdScan) {
      // console.log(tag, 'Saved scan for beacon: ', createdScan.beaconId);
      // process.stdout.write('.');
      return;
    }, function(error) {
      console.log(tag, 'Error saving scan: ', error);
    });
  }

  live.getScanFeed('/topic/beaconEvents_processed').subscribe(function(scan) {
    // console.log(tag, 'user', scan.user.name, 'location', scan.location.name);
    saveScan(scan);
    wss.broadcast(JSON.stringify({type: 'scan', data: scan}));
  });
}
