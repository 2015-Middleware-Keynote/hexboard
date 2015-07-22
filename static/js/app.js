'use strict';

var hex = hex || {};

(function hexboard(d3, Rx) {
  var run = function() {
    if (hex.autoStart === true) {
      hex.feed.subscribe();
    }

  };

  run();

  Rx.Observable.fromEvent(window, 'resize')
    .debounce(500 /* ms */)
    .tap(function(event) {
      console.log('Resizing hexboard');
      hex.board.init();
      hex.winner.init();
    })
    .subscribeOnError(hex.feed.errorHandler);

})(d3, Rx);
