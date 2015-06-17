'use strict';

var hex = hex || {};

(function hexboard(d3, Rx) {
  var run = function() {
    if (hex.autoStart === true) {
      hex.ui.subscribe();
    }

  };

  run();
})(d3, Rx);
