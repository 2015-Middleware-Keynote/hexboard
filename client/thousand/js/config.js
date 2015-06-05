'use strict';

var hex = hex || {};

hex.config = (function() {
  var getParameterByName=  function (name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  return {
      backend: {
        ws: 'ws://localhost:9000'
      }
    , playback: {
        rate: getParameterByName('rate') || 600
      }
  };
})();
