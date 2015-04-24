var app   = require('./main/app.js')
  , http = require('http')
  , port  = app.get('port')
  , ip = app.get('base url')
  , log   = 'Listening on ' + ip + ':' + port
  , WebSocketServer = require('ws').Server
  , Rx = require('rx')
  , data = require('./randomscans')
  , stomp = require('./stompscans')
  , Scan = require('./api/scan/scan_model')
  , thousand = require('./thousand')
  ;

var server = http.createServer(app);
server.listen(port, ip);
console.log(log);

var wssRandom = new WebSocketServer({server: server, path: '/random'});
var wssLive = new WebSocketServer({server: server, path: '/live'});
var wssThousand = new WebSocketServer({server: server, path: '/thousand'});

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

wssThousand.on('connection', function connection(ws) {
  console.log('/thousand connection');
  var subscription1
    , subscription2;
  subscription1 = thousand.events.subscribe(function(event) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({type: 'event', data: event}));
    };
  }, null, function() {
    subscription2 = thousand.doodles.subscribe(function(doodle) {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({type: 'doodle', data: doodle}));
      };
    }, null, function() {
      console.log('Container event cycle complete, closing connection');
      ws.close();
    });
  });
  ws.onclose = function() {
    console.log('Onclose: disposing /thousand subscriptions');
    subscription2 && subscription2.dispose();
    subscription1 && subscription1.dispose();
  };
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
