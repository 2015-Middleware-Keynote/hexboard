'use strict';

var rawfeed = rawfeed || {};

d3demo.layout = (function dataSimulator(d3, Rx) {

  var width = d3demo.layout.width
    , height = d3demo.layout.height
    , locations = d3demo.layout.locations;

  var i = 0;

  var svg = d3.select('.map').append('svg')
    .attr('width', width)
    .attr('height', height);

  function particle(location) {
        svg.insert('circle', 'rect')
        .attr('cx', location.x)
        .attr('cy', location.y)
        .attr('r', 1e-6)
        .style('stroke', d3.hsl((i = (i + 1) % 360), 1, .5))
        .style('stroke-opacity', 1)
      .transition()
        .duration(2000)
        .ease(Math.sqrt)
        .attr('r', 100)
        .style('stroke-opacity', 1e-6)
        .remove();
  };

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  Rx.Observable.interval(25).map(function() {
    var location = locations[getRandomInt(0, locations.length)];
    particle(location);
  }).take(10000).subscribe();

})(d3, Rx);
