'use strict';

var hex = hex || {};

hex = (function dataSimulator(d3, Rx) {

  var width = 1300
    , height = 800
    ;

  var hexAngles = d3.range(0, 2 * Math.PI, Math.PI / 3);

  var hexagon = function(radius) {
    var x0 = 0, y0 = 0;
    return hexAngles.map(function(angle) {
      var x1 = Math.sin(angle) * radius,
          y1 = -Math.cos(angle) * radius,
          dx = x1 - x0,
          dy = y1 - y0;
      x0 = x1, y0 = y1;
      return [dx, dy];
    });
  }

  var hexagonsPerRow = 38;
  var randomX = d3.random.normal(width / 2, 80),
      randomY = d3.random.normal(height / 2, 80),
      points = d3.range(1026).map(function(currentValue, index) {
        var x_i =  (index % hexagonsPerRow) + 1
          , y_i = (Math.floor(index / hexagonsPerRow)) + 1;
        if (y_i % 2 !== 0) {
          x_i = x_i + 0.5
        }
        return {x: 31 * x_i, y: 27 * y_i};
      });

  console.log(points.length);

  var color = d3.scale.linear()
      .domain([0, 20])
      .range(["white", "steelblue"])
      .interpolate(d3.interpolateLab);

  var svg = d3.select(".map").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      ;

  svg.append("clipPath")
      .attr("id", "clip")
    .append("rect")
      .attr("class", "mesh")
      .attr("width", width)
      .attr("height", height);

  var hexagons = svg.append("g")
      .attr("clip-path", "url(#clip)")
    .selectAll(".hexagon")
      .data(points)
    .enter().append("path")
      .attr("class", "hexagon")
      .attr("d", "m" + hexagon(18).join("l") + "z")
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .style("fill", function(d) { return color(2); });

  function particle(p) {
    var p0 = {x: getRandomInt(1, width), y: getRandomInt(1, height)};
    var s = 0.1;
    svg.insert("path")
      .attr("class", "hexagon")
      .attr("d", "m" + hexagon(18/s).join("l") + "z")
      .attr("transform", function(d) { return "translate(" + p0.x + "," + p0.y + ")"; })
      .style("fill", function(d) { return color(20); })
      .style('fill-opacity', .2)
    .transition()
      .duration(1000)
      .ease('quad-out')
      .attr('transform', 'matrix('+s+', 0, 0, '+s+', '+ p.x +', '+ p.y +')')
      .style('fill-opacity', 1)
      .remove();
    hexagons.filter(function(d) { return d.x === p.x && d.y === p.y; })
      .transition()
      .duration(1000)
      .ease('quad-in')
      .style("fill", function(d) { return color(20); })
  };

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  Rx.Observable.interval(25).map(function() {
    var point = points[getRandomInt(0, points.length)];
    try {
      particle(point);
    } catch(error) {
      console.error(error.stack);
      throw error
    }
  }).take(10000).subscribeOnError(function(error) {
    throw error;
  });

})(d3, Rx);
