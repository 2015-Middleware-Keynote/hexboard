'use strict';

var hex = hex || {};

hex.controls = (function dataSimulator(d3, Rx) {

  // keyboard controls
  Rx.Observable.fromEvent(document.getElementsByTagName('body')[0], 'keyup')
  .filter(function(event) {
    return [37, 38, 39, 40, 13].some(function(keyCode) {
      return keyCode == event.keyCode;
    });
  })
  .tap(function(event) {
    var newId;
    var pushButton = document.getElementById('push-doodles');
    if (pushButton && pushButton === document.activeElement) {
      pushButton.blur();
    }
    switch(event.keyCode) {
      case 37: // LEFT
        newId = hex.highlight.moveHighlightHorizontally(-1);
        console.log(newId)
        hex.highlight.highlight(newId);
        break;
      case 38: // UP
        newId = hex.highlight.moveHighlightVertically(-1);
        console.log(newId)
        hex.highlight.highlight(newId);
        break;
      case 39: // RIGHT
        newId = hex.highlight.moveHighlightHorizontally(1);
        console.log(newId)
        hex.highlight.highlight(newId);
        break;
      case 40: // DOWN
        newId = hex.highlight.moveHighlightVertically(1);
        console.log(newId)
        hex.highlight.highlight(newId);
        break;
      case 13: // ENTER
        hex.winner.pickWinner();
        break;
    };
  })
  .subscribeOnError(hex.errorObserver);

  // websocket controls
  hex.messages.filter(function(message) {
    return message.type === 'winner';
  }).tap(function(message) {
    var doodlesPresent = hex.points.some(function(point) {
      return !! point.doodle;
    });
    if (! doodlesPresent) {
      return;
    }
    var action = message.data;
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
        hex.winner.pickWinner();
        break;
    };
  }).subscribeOnError(hex.errorObserver);

  // mouse controls
  var lastDoodle;
  Rx.Observable.fromEvent(document.querySelector('.map'), 'mousemove')
  .filter(function(event) {
    return event.target.classList.contains('doodle');
  })
  .tap(function(event) {
    var p = d3.select(event.target).datum();
    if (lastDoodle === p) {
      return;
    };
    var newId = p.id;
    console.log('highlighting ', newId);
    hex.highlight.highlight(newId);
  })
  .subscribeOnError(hex.errorObserver);

  Rx.Observable.fromEvent(document.querySelector('.map'), 'click')
  .filter(function(event) {
    return event.target.classList.contains('highlight');
  })
  .tap(function(event) {
    var p = d3.select(event.target).datum();
    var newId = p.id;
    console.log('picking ', newId);
    hex.winner.pickWinner(newId);
  })
  .subscribeOnError(hex.errorObserver);

})(d3, Rx);
