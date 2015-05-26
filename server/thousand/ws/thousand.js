'use strict';

var WebSocketServer = require('ws').Server
  , random = require('../random')
  , pod = require('../pod')
  , playback = require('../playback')
  , thousandEmitter = require('../thousandEmitter')
  , debuglog = require('debuglog')('thousand')
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

  wss.on('connection', function connection(ws) {
    var id = count++;
    clients[id] = ws;
    ws.id = id;
    console.log(tag, '/thousand connection');
    var subscription;
    ws.on('message', function(data, flags) {
      var message = JSON.parse(data);
      if (message.type === 'subscribe') {
        console.log('Subscribe event:', message)
        subscription = subscribeToPodEvents(ws, message.feed);
      };
      if (message.type === 'ping') {
        ws.send(JSON.stringify({type: 'pong'}));
      };
    });
    ws.onclose = function() {
      console.log(tag, 'Onclose: disposing /thousand subscriptions');
      subscription && subscription.dispose();
    };
  });

  var subscribeToPodEvents = function(ws, feed) {
    var eventFeed;
    switch (feed) {
      case 'live':
        eventFeed = pod.events();
        break;
      case 'random':
        eventFeed = random.events;
        break;
      case 'playback':
      default:
        eventFeed = playback.events();
        break;
    }
    var subscription = eventFeed.tap(function(pod) {
      debuglog('pod event, id:', pod.id, 'stage:', pod.stage, 'creationTimestamp', pod.creationTimestamp);
      ws.send(JSON.stringify({type: 'event', data: pod}));
    })
    .subscribeOnError(function(err) {
      ws.send(JSON.stringify({type: 'error', data: err}));
      console.log('err:', err)
    });
    return subscription;
  };

  thousandEmitter.on('new-doodle', function(doodle) {
    console.log(tag, 'doodle listener invoked.');
    wss.broadcast(JSON.stringify({type: 'doodle', data: doodle}));
  });

  thousandEmitter.on('action', function(action) {
    console.log(tag, 'winner listener invoked.');
    wss.broadcast(JSON.stringify({type: 'winner', data: action}));
  });
};
