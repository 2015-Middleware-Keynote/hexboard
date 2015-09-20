'use strict';

var hex = hex || {};

hex.controls = (function dataSimulator(d3, Rx) {

  var getParameterByName=  function (name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  };

  // Admin token management
  if(getParameterByName('logout') == 'true'){
    localStorage.clear();
    document.location.assign('?');
  }
  var adminToken = false;
  var auth = '';
  if(getParameterByName('admin') !== ''){
    localStorage.adminToken = getParameterByName('admin');
    document.location.assign('?');
  }
  if( typeof localStorage.adminToken !== 'undefined' ){
    adminToken = localStorage.adminToken;
    document.getElementById('navbar-admin-controls').style = "display:block;"
  }
  if(adminToken){
    auth = "?token=" + adminToken;
  }

  Rx.Observable.fromEvent(d3.select('#push-sketches').node(), 'click').subscribe(function() {
    var xhr = d3.xhr('/api/sketch/random/10' + auth, function(err, res) {
      console.log(err || res);
    });
  });

  Rx.Observable.fromEvent(d3.select('#remove-sketches').node(), 'click').subscribe(function() {
    var xhr = d3.xhr('/api/sketch/all' + auth);
    xhr.send('DELETE', function(err, res) {
      console.log('removing all sketches');
      console.log(err || res);
    });
  });

  var plabackButton = document.getElementById('start-playback');
  if (plabackButton) {
    Rx.Observable.fromEvent(plabackButton, 'click').subscribe(function() {
      console.log('Playback start');
      hex.feed.subscribe();
    });
  }

  var winnerSocket = Rx.DOM.fromWebSocket(hex.config.backend.ws + '/winner');
  winnerSocket.subscribeOnError(hex.feed.errorHandler);

  // keyboard controls
  var keyboardSubscription = Rx.Observable.fromEvent(document.getElementsByTagName('body')[0], 'keyup')
  .filter(function(event) {
    return [37, 38, 39, 40, 13].some(function(keyCode) {
      return keyCode == event.keyCode;
    });
  })
  .tap(function(event) {
    var newId;
    var pushButton = document.getElementById('push-sketches');
    if (pushButton && pushButton === document.activeElement) {
      pushButton.blur();
    }
    switch(event.keyCode) {
      case 37: // LEFT
      winnerSocket.onNext(JSON.stringify({key: 'test', msg: {action: 'left'}}));
        break;
      case 38: // UP
        winnerSocket.onNext(JSON.stringify({key: 'test', msg: {action: 'up'}}));
        break;
      case 39: // RIGHT
        winnerSocket.onNext(JSON.stringify({key: 'test', msg: {action: 'right'}}));
        break;
      case 40: // DOWN
        winnerSocket.onNext(JSON.stringify({key: 'test', msg: {action: 'down'}}));
        break;
      case 13: // ENTER
        var highlightedHexagon = hex.highlight.getHighlightedHexagon();
        if (highlightedHexagon) {
          var index = highlightedHexagon.datum().id;
          winnerSocket.onNext(JSON.stringify({key: 'test', msg: {action: 'pick', value: index}}));
        }
        break;
    };
  })
  .subscribeOnError(hex.feed.errorObserver);

  // websocket controls
  var websocketStream = hex.feed.messages.filter(function(message) {
    return message.type === 'winner';
  }).tap(function(message) {
    var sketchesPresent = hex.board.hexboard.points.some(function(point) {
      return !! point.sketch;
    });
    if (! sketchesPresent) {
      return;
    }
    var action = message.data.action;
    console.log('Winner action: ', action);
    var newId;
    switch (action) {
      case 'left':
        newId = hex.highlight.moveHighlightHorizontally(-1);
        console.log(newId);
        hex.highlight.highlight(newId);
        break;
      case 'right':
        newId = hex.highlight.moveHighlightHorizontally(1);
        console.log(newId);
        hex.highlight.highlight(newId);
        break;
      case 'up':
        newId = hex.highlight.moveHighlightVertically(-1);
        console.log(newId);
        hex.highlight.highlight(newId);
        break;
      case 'down':
        newId = hex.highlight.moveHighlightVertically(1);
        console.log(newId);
        hex.highlight.highlight(newId);
        break;
      case 'pick':
        hex.winner.pickWinner(message.data.value);
        break;
    };
  });

  // mouse controls
  var lastDoodle;
  var mouseSubscription = Rx.Observable.fromEvent(document.querySelector('.svg-container'), 'mousemove')
  .tap(function(event) {
    if (event.target.classList.contains('highlight')) {
      event.stopPropagation();
      return;
    }
    if (event.target.classList.contains('sketch')) {
      event.stopPropagation();
      var p = d3.select(event.target).datum();
      if (lastDoodle === p || ! hex.winner.isAllowedToWin(p)) {
        return;
      };
      var newId = p.id;
      if (adminToken) {
        hex.inspect.highlight(newId);
      } else {
        hex.highlight.highlight(newId);
      }
    } else {
      event.stopPropagation();
      hex.highlight.unhighlight();
    };
  })
  .subscribeOnError(hex.feed.errorObserver);

  Rx.Observable.fromEvent(document.querySelector('.svg-container'), 'click')
  .filter(function(event) {
    return event.target.classList.contains('hexagon');
  })
  .tap(function(event) {
    var p = d3.select(event.target).datum();
    if ((event.metaKey || event.ctrlKey) && p.sketch) {
      winnerSocket.onNext(JSON.stringify({key: 'test', msg: {action: 'pick', value: p.id}}));
    } else if (event.target.classList.contains('inspect') && adminToken) {
      var index = p.id;
      var xhr = d3.xhr('/api/sketch/' + p.id + auth);
      xhr.send('DELETE', function(err, res) {
        console.log('removing ', index);
        console.log(err || res);
      });
    } else if (p.stage === 5 && p.url) {
      window.open(p.url, '_pod');
    };
  })
  .subscribeOnError(hex.feed.errorObserver);

  var dispose = function() {
    keyboardSubscription.dispose();
    // websocketSubscription.dispose();
    mouseSubscription.dispose();
  };

  return {
    dispose: dispose,
    websocketStream: websocketStream,
    winnerSocket: winnerSocket,
    adminEnabled: adminToken
  }

})(d3, Rx);
