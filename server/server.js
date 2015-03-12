var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({
      host: process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0'
    , port: process.env.OPENSHIFT_NODEJS_PORT || 8000 
    })
  , Rx = require('rx')
  , data = require('./randomscans');

wss.on('connection', function connection(ws) {
  console.log('connection');
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
    console.log('Onclose: disposing subscriptions');
    subscription.dispose();
  }
});
