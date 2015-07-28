'use strict';

var hex = hex || {};

hex.feed = (function dataSimulator(d3, Rx) {
  var errorObserver = function(error) {
    console.error(error.stack || error);
  };

  var openObserver = Rx.Observer.create(
    function(open) {
      var ws = open.target;
      ws.send(JSON.stringify({
        type: 'subscribe'
      , feed: hex.datafeed
      }));
      hex.ping.onNext(open);
    }
  , function (err) {
      hex.ping.onError(err);
    }
  , function() {
      hex.ping.onCompleted();
    }
  );

  var messages = Rx.DOM.fromWebSocket(hex.config.backend.ws + '/thousand', null, openObserver)
  .map(function(messageEvent) {
    return JSON.parse(messageEvent.data);
  }).share();

  var setupStream = messages.filter(function(message) {
    return message.type === 'setup';
  })
  .tap(function(message) {
    hex.board.hexboard.honeycomb = message.data;
    hex.board.init();
    hex.winner.init();
  });

  var eventStream = messages.filter(function(message) {
    return message.type === 'event';
  })
  .tap(function(message) {
    var event = message.data;
    hex.board.particle(event);
  });

  var errorStream = messages.filter(function(message) {
    return message.type === 'error';
  })
  .tap(function(message) {
    var error = message.data;
    var errorMessage = 'Error requesting data from OpenShift:\n' + error.code + ': ' + error.message;
    errorMessage += '\n\nUpdate the OAuth token of the UI deployment to see live data';
    console.error(errorMessage);
    alert(errorMessage);
  });

  var sketchStream = messages.filter(function(message) {
    return message.type === 'sketch' && hex.showSketches;
  })
  .tap(function(message) {
    var sketch = message.data;
    var point = hex.board.hexboard.points[sketch.containerId];
    if (hex.board.hexboard.firstImage) {
      hex.board.hexboard.firstImage = false;
      var flipRequired = hex.board.hexboard.points.some(function(point) {
        return point.stage === 5;
      });
      if (flipRequired) {
        hex.board.flipAll();
      }
    }
    hex.board.image(point, sketch, ! hex.controls.adminEnabled);
  });

  var sketchBundleStream = messages.filter(function(message) {
    return message.type === 'sketch-bundle' && hex.showSketches;
  })
  .flatMap(function(message) {
    return message.data;
  })
  .tap(function(sketch) {
    var point = hex.board.hexboard.points[sketch.containerId];
    if (! point.sketch) {
      if (hex.board.hexboard.firstImage) {
        hex.board.hexboard.firstImage = false;
        if (hex.board.hexboard.points.some(function(point) {
          return point.stage === 5;
        }))
        flipAll();
      }
      hex.board.image(point, sketch, false);
      console.log(point, sketch)
    };
  });

  var removeStream = messages.filter(function(message) {
    return message.type === 'remove';
  })
  .tap(function(message) {
    var point = hex.board.hexboard.points.filter(function(point) {
      return point.id === message.data.id;
    });
    if (point.length && point[0].sketch) {
      hex.board.removeSketch(point[0]);
    };
  });

  var removeBundleStream = messages.filter(function(message) {
    return message.type === 'removeAll';
  })
  .tap(function() {
    hex.inspect.unhighlight();
    hex.highlight.unhighlight();

    hex.board.hexboard.points.forEach(function(point) {
      if (point.sketch) {
        hex.board.clear(point);
      };
    });
  });

  var cover = d3.select('#cover');
  if (cover) {
    cover.style({visibility: 'visible', opacity: '0.6'});
  }

  var subscriptions = {};
  var subscribe = function() {
    if (cover) {
      cover.on('transitionend', function() {
        cover.style({display: 'none'});
      })
      cover.style({visibility: 'visible', opacity: '0.0'});

    }
    subscriptions.setup = setupStream.subscribeOnError(errorObserver);
    subscriptions.sketch = sketchStream.subscribeOnError(errorObserver);
    subscriptions.event = eventStream.subscribeOnError(errorObserver);
    subscriptions.error = errorStream.subscribeOnError(errorObserver);
    subscriptions.sketchBundle = sketchBundleStream.subscribeOnError(errorObserver);
    subscriptions.remove = removeStream.subscribeOnError(errorObserver);
    subscriptions.removeBundle = removeBundleStream.subscribeOnError(errorObserver);
    subscriptions.controls = hex.controls.websocketStream.subscribeOnError(errorObserver);
  }

  var dispose = function() {
    subscriptions.setup.dispose();
    subscriptions.sketch.dispose();
    subscriptions.event.dispose();
    subscriptions.error.dispose();
    subscriptions.sketchBundle.dispose();
    subscriptions.remove.dispose();
    subscriptions.removeBundle.dispose();
    subscriptions.controls.dispose();
  };

  return {
    errorObserver: errorObserver
  , messages: messages
  , subscribe: subscribe
  , dispose: dispose
  }

})(d3, Rx);
