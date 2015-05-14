'use strict';

var WebSocketServer = require('ws').Server
  , winner = require('../winner')
  ;

var tag = 'WS/WINNER';

module.exports = function(server) {
  var wss = new WebSocketServer({server: server, path: '/winner'});

  wss.on('connection', function connection(ws) {
    console.log(tag, '/winner connection');
    ws.on('message', function(data, flags) {
      var message = JSON.parse(data);
      if (!message.key) {
        ws.send(JSON.stringify({msg: 'invalid key'}));
        return;
      }
      if (message.msg === 'ping') {
        ws.send(JSON.stringify({msg: 'pong'}));
      } else {
        winner.winnerEmitter.emit('action', message.msg);
      }
    });
    ws.onclose = function() {
      console.log(tag, 'Onclose: disposing /winner subscriptions');
    };
  });
};
