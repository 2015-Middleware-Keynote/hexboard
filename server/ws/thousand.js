'use strict';

var WebSocketServer = require('ws').Server
  , thousand = require('../thousand')
  ;

module.exports = function(server) {
  var wss = new WebSocketServer({server: server, path: '/thousand'});

  var eventEmitter = thousand.doodleEmitter;

  wss.on('connection', function connection(ws) {
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
    ws.onclose = function() {
      console.log('Onclose: disposing /thousand subscriptions');
      subscription2 && subscription2.dispose();
      subscription1 && subscription1.dispose();
    };
  });

  eventEmitter.on('new-doodle', function(doodle) {
    console.log('doodle listener invoked.');
    wss.broadcast(doodle);
  });

  wss.broadcast = function broadcast(doodle) {
  wss.clients.forEach(function each(ws) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({type: 'doodle', data: doodle}));
    };
  });
};
}
