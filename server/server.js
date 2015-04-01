var app   = require('./main/app.js')
  , http = require('http')
  , port  = app.get('port')
  , ip = app.get('base url')
  , log   = 'Listening on ' + ip + ':' + port
  , WebSocketServer = require('ws').Server
  , Rx = require('rx')
  , data = require('./randomscans')
  , stomp = require('./stompscans')
  ;

var server = http.createServer(app);
server.listen(port, ip);
console.log(log);

var wssRandom = new WebSocketServer({server: server, path: '/random'});
var wssLive = new WebSocketServer({server: server, path: '/live'});

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

stomp.scans.subscribe(function(scan) {
  // console.log('user', scan.user.name, 'location', scan.location.name);
  wssLive.broadcast(JSON.stringify({type: 'scan', data: scan}));
});
