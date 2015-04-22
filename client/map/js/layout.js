'use strict';

var d3demo = d3demo || {};

d3demo.layout = (function dataSimulator(d3, Rx) {
  var scale, width, height;
  var locations = [
    { id: 0, x_i: 370, y_i: 1270, name: 'Entrance'}
  , { id: 1, x_i: 310, y_i: 510, name: 'General Sessions'}
  , { id: 2, x_i: 860, y_i: 240, name: 'Lunch 1'}
  , { id: 3, x_i: 1590, y_i: 210, name: 'Lunch 2'}
  , { id: 4, x_i: 860, y_i: 600, name: 'Red Hat Booth 1'}
  , { id: 5, x_i: 1570, y_i: 600, name: 'Red Hat Booth 2'}
  , { id: 6, x_i: 90,  y_i: 1110, name: 'Room 200 DV Lounge and Hackathons'}
  , { id: 7, x_i: 680, y_i: 1170, name: 'Room 201 DEVNATION Track'}
  , { id: 8, x_i: 870, y_i: 1170, name: 'Room 202 DEVNATION Track'}
  , { id: 9, x_i: 1070, y_i: 1170, name: 'Room 203 DEVNATION Track'}
  , { id: 10, x_i: 1250, y_i: 1170, name: 'Room 204 DEVNATION Track'}
  , { id: 11, x_i: 1800, y_i: 150, name: 'Ballroom A 3rd floor'}
  ];

  var users = [];
  // initialize the users
  for (var i = 0; i < 200; i++) {
    users.push({
      id: i
    , name: i === 13 ? 'Burr Sutter' : 'Firstname' + i + ' Lastname' + i
    });
  };

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
  }
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
  , locations: locations
  , users: users
  }
})(d3, Rx);
