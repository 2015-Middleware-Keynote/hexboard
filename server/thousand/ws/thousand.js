'use strict';

var WebSocketServer = require('ws').Server
  , random = require('../random')
  , pod = require('../pod')
  , playback = require('../playback')
  , thousandEmitter = require('../thousandEmitter')
  ;

var tag = 'WS/THOUSAND';

module.exports = function(server) {
  var wss = new WebSocketServer({server: server, path: '/thousand'});

  var count = 0;
  var clients = {};

  wss.broadcast = function broadcast(data) {
    for (var i in clients) {
      var ws = clients[i];
      if (ws.readyState === ws.OPEN) {
        ws.send(data);
      } else if (ws.readyState === ws.CLOSED) {
        console.log(tag, 'Peer #' + ws.id + ' disconnected from /thousand.');
        delete clients[ws.id];
      }
    };
  };

  var eventFeed = process.env.ACCESS_TOKEN ? pod.events : playback.events

  wss.on('connection', function connection(ws) {
    var id = count++;
    clients[id] = ws;
    ws.id = id;
    console.log(tag, '/thousand connection');
    var subscription;
    // subscription = random.events.tap(function(event) {
    //   if (ws.readyState === ws.OPEN) {
    //     ws.send(JSON.stringify({type: 'event', data: event}));
    //   };
    // })
    // .subscribeOnError(function(err) {
    //   console.log(err.stack || err);
    // });
    subscription = eventFeed().tap(function(pod) {
      console.log('pod event, id:', pod.id, 'stage:', pod.stage, 'creationTimestamp', pod.creationTimestamp);
      ws.send(JSON.stringify({type: 'event', data: pod}));
    })
    .subscribeOnError(function(err) {
      console.log(err.stack || err);
    });
    ws.on('message', function(data, flags) {
      var message = JSON.parse(data);
      if (message.type === 'ping') {
        ws.send(JSON.stringify({type: 'pong'}));
      }
    });
    ws.onclose = function() {
      console.log(tag, 'Onclose: disposing /thousand subscriptions');
      subscription && subscription.dispose();
    };
  });

  thousandEmitter.on('new-doodle', function(doodle) {
    console.log(tag, 'doodle listener invoked.');
    wss.broadcast(JSON.stringify({type: 'doodle', data: doodle}));
  });

  thousandEmitter.on('action', function(action) {
    console.log(tag, 'winner listener invoked.');
    wss.broadcast(JSON.stringify({type: 'winner', data: action}));
  });
};
