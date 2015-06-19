'use strict';

var hex = hex || {};

hex.ping = (function dataSimulator(d3, Rx) {
  var errorObserver = function(error) {
    console.error(error.stack || error);
  };

  var openObserver = Rx.Observer.create(function(open) {
    var ws = open.target;
    var lastPong = new Date().getTime();
    var ttl = 5000;
    var pinger = Rx.Observable.interval(ttl)
    var ping = JSON.stringify({
      type: 'ping'
    });
    Rx.Observable.interval(ttl)
    .tap(function() {
      if (ws.readyState === ws.OPEN) {
        ws.send(ping);
        // console.log(">>> PING");
        if (new Date().getTime() - lastPong > ttl * 3000) {
          ws.close();
          throw new Error('Server has gone more than ' + 3 * ttl + 'ms without a response');
        }
      };
      ws.onmessage = function(messageEvent) {
        var message = JSON.parse(messageEvent.data);
        if (message.type === 'pong') {
          lastPong = new Date().getTime();
          // console.log("<<< PONG");
        }
      };
    })
    .subscribeOnError(errorObserver);
  });

return openObserver;

})(d3, Rx);
