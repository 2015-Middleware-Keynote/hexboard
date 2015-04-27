'use strict';

var WebSocketServer = require('ws').Server
  , thousand = require('../thousand')
  ;

module.exports = function(server) {
  var wss = new WebSocketServer({server: server, path: '/thousand'});

  var eventEmitter = thousand.doodleEmitter;

  var count = 0;
  var clients = {};

  wss.broadcast = function broadcast(data) {
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

  wss.on('connection', function connection(ws) {
    var id = count++;
    clients[id] = ws;
    ws.id = id;
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
      });
    });
    ws.on('message', function(data, flags) {
      var message = JSON.parse(data);
      if (message.type === 'ping') {
        ws.send(JSON.stringify({type: 'pong'}));
      }
    });
    ws.onclose = function() {
      console.log('Onclose: disposing /thousand subscriptions');
      subscription2 && subscription2.dispose();
      subscription1 && subscription1.dispose();
    };
  });

  eventEmitter.on('new-doodle', function(doodle) {
    console.log('doodle listener invoked.');
    wss.broadcast(JSON.stringify({type: 'doodle', data: doodle}));
  });
};
