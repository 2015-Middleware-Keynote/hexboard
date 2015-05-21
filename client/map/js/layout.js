'use strict';

var d3demo = d3demo || {};

d3demo.layout = (function dataSimulator(d3, Rx) {
  var scale, width, height;
  var locations = [];

  var getLocations = function() {
    return locations;
  };

  var initLocations = Rx.DOM.ajax({url: '/api/locations'})
    .tap(function(data) {
      locations = JSON.parse(data.response);
      sizeMap();
    });

  // Dynamically size the map and other elements to fill the screen
  var sizeMap = function(event) {
    var mapContainer = document.querySelector('.map');
    var windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || height);
    height = windowHeight - 40;
    scale = height / 1389;
    width = 1949*scale;

    locations.forEach(function(location, index) {
      location.x = location.x_i * scale;
      location.y = location.y_i * scale;
    });

    if (mapContainer) {
      mapContainer.style.height = height + 'px';
      mapContainer.style.width = width + 'px';
    };

//    document.querySelector('.progress').style.width = width - 100 + 'px';

    var logContainer = document.getElementById('log');
    var logContainerHeight = windowHeight - 234;
    logContainer && (logContainer.style.height = logContainerHeight + 'px');

    var legend = document.querySelector('.legend');
    legend && (legend.style.left = width -70 + 'px');
  };
  sizeMap();

  // Adjust the map size and location co-ords when the window is resized
  window.onresize = function(event) {
    sizeMap();
    var myEvent = new CustomEvent('mapresize', {detail: {scale: scale, width: width, height: height}});
    document.dispatchEvent(myEvent);
  }

  return {
    width: width
  , height: height
  , getLocations: getLocations
  , initLocations: initLocations
  }
})(d3, Rx);
