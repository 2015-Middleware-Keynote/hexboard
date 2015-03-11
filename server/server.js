var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 9000 })
  , Rx = require('rx')
  , data = require('./randomscans');

wss.on('connection', function connection(ws) {
  console.log('connection');
  var clock, scans;
  data.playback(function(playbackClock, randomScans) {
    clock = playbackClock.subscribe(function(tick) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({type: 'tick', data: tick}));
      };
    }, null, function() {
      if (ws.readyState === ws.OPEN) {
        console.log('Playback complete, closing connection');
        ws.close();
      };
    });
    scans = randomScans.subscribe(function(scan) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({type: 'scan', data: scan}));
      };
    }, null, function() {
      if (ws.readyState === ws.OPEN) {
        console.log('Playback complete, closing connection');
        ws.close();
      };
    });
  });
  ws.onclose = function() {
    console.log('Onclose: disposing subscriptions');
    clock.dispose();
    scans.dispose();
  }
});
