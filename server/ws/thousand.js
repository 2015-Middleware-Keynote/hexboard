'use strict';

var WebSocketServer = require('ws').Server
  , thousand = require('../thousand')
  ;

module.exports = function(server) {
  var wssThousand = new WebSocketServer({server: server, path: '/thousand'});

  var eventEmitter = thousand.doodleEmitter;

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
      });
    });
    var listener = function(doodle) {
      console.log('doodle listener invoked.');
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({type: 'doodle', data: doodle}));
      };
    };
    eventEmitter.on('new-doodle', listener)
    ws.onclose = function() {
      console.log('Onclose: disposing /thousand subscriptions');
      subscription2 && subscription2.dispose();
      subscription1 && subscription1.dispose();
      listener && eventEmitter.removeListener('new-doodle', listener);
    };
  });
}
