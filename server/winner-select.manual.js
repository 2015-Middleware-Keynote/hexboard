'use strict';

var WebSocket = require('ws')
  ;

var ws = new WebSocket('ws://localhost:9000/winner');
ws.on('open', function open() {
  ws.send(JSON.stringify({
    key: 'somekey'
  , msg: 'right'
  }));
  setTimeout(function() {
    ws.send(JSON.stringify({
      key: 'somekey'
    , msg: 'down'
    }));
  }, 500)
  setTimeout(function() {
    ws.send(JSON.stringify({
      key: 'somekey'
    , msg: 'left'
    }));
  }, 1500)
  setTimeout(function() {
    ws.send(JSON.stringify({
      key: 'somekey'
    , msg: 'up'
    }));
  }, 2000)
});
