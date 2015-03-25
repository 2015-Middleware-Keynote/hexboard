var app   = require('./main/app.js')
  , http = require('http')
  , port  = app.get('port')
  , ip = app.get('base url')
  , log   = 'Listening on ' + ip + ':' + port
  , WebSocketServer = require('ws').Server
  , Rx = require('rx')
  , data = require('./randomscans')
  ;

var server = http.createServer(app);
server.listen(port, ip);
console.log(log);

var wss = new WebSocketServer({server: server});

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
