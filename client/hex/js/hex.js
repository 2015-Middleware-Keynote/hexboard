'use strict';

var hex = hex || {};

hex = (function dataSimulator(d3, Rx) {

  var size = 20;
  var display = {
    x: Math.max(document.documentElement.clientWidth, window.innerWidth) || 1920
  , y: Math.max(document.documentElement.clientHeight, window.innerHeight) - 4
  };
  var honeycomb = {
    spacing: {
      x: size * 2 * Math.sin(Math.PI*2/3)
    , y: size * (1 + Math.cos(Math.PI/3))
    }
  };

  honeycomb.dimensions = {
    x: (38 +1) * honeycomb.spacing.x + 1
  , y: (27 + 1) * honeycomb.spacing.y
  };

  var margin = {
      top: (display.y - honeycomb.dimensions.y) / 2
    , right: (display.x - honeycomb.dimensions.x) / 2
    , bottom: (display.y - honeycomb.dimensions.y) / 2
    , left: (display.x - honeycomb.dimensions.x) / 2
  };

  var  width = display.x - margin.left - margin.right
   ,  height = display.y - margin.top - margin.bottom;

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
  var points = d3.range(1026).map(function(currentValue, index) {
        var x_i =  (index % hexagonsPerRow) + 1
          , y_i = (Math.floor(index / hexagonsPerRow)) + 1;
        if (y_i % 2 !== 0) {
          x_i = x_i + 0.5
        }
        var x = honeycomb.spacing.x * x_i;
        var y = honeycomb.spacing.y * y_i;
        return {x: x, y: y, stage: 0};
      });

  console.log(points.length);

  var color = d3.scale.linear()
    .domain([0, 3, 7])
    .range(['#dae7f1', 'steelblue', '#1d3549'])
    .interpolate(d3.interpolateLab);

  var svg = d3.select('.map').append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      ;

  svg.append('clipPath')
      .attr('id', 'clip')
    .append('rect')
      .attr('class', 'mesh')
      .attr('width', width)
      .attr('height', height);

  var hexagons = svg.append('g')
      .attr('clip-path', 'url(#clip)')
    .selectAll('.hexagon')
      .data(points)
    .enter().append('path')
      .attr('class', 'hexagon')
      .attr('d', 'm' + hexagon(size).join('l') + 'z')
      .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
      .style('fill', function(d) { return color(0); });

  function particle(p) {
    var c = {x: width / 2, y: height / 2};
    var perspective = 1.5
      , duration = 500
      , scale = 0.4
      , opacity = { initial: 0.01, final: 0.9};
    var p0 = {x: perspective * (p.x - c.x) + c.x, y: perspective * (p.y - c.y) + c.y};
    p.stage++;
    var newColor = color(p.stage);
    svg.insert('path')
      .attr('class', 'hexagon')
      .attr('d', 'm' + hexagon(size/scale).join('l') + 'z')
      .attr('transform', function(d) { return 'translate(' + p0.x + ',' + p0.y + ')'; })
      .style('fill', function(d) { return newColor; })
      .style('fill-opacity', opacity.initial)
    .transition()
      .duration(duration)
      .ease('quad-out')
      .attr('transform', 'matrix('+scale+', 0, 0, '+scale+', '+ p.x +', '+ p.y +')')
      .style('fill-opacity', opacity.final)
      .remove();
    hexagons.filter(function(d) { return d.x === p.x && d.y === p.y; })
      .transition()
      .duration(duration)
      .ease('quad-in')
      .style('fill', function(d) { return  newColor; })
  };

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  var serverStageChanges = [];
  points.forEach(function(point, index) {
    serverStageChanges[index] = [];
    for (var i = 0; i < 7; i++ ) {
      var interval = getRandomInt(2000, 3000);
      var previousTime = i > 0 ? serverStageChanges[index][i - 1] : 0;
      serverStageChanges[index].push(previousTime + interval);
    };
  });

  var interval = 10;
  console.log('timer started');
  Rx.Observable.interval(interval).map(function(x) {
    var time = x * interval;
    serverStageChanges.forEach(function(stateChange, index) {
      if (stateChange.length < 1) {
        return;
      }
      if (stateChange[0] < time) {
        try {
          stateChange.shift();
          particle(points[index]);
        } catch(error) {
          console.error(error.stack);
          throw error;
        }
      };
    });
  }).take(30000 / interval).subscribe(
    undefined
  , function(error) {
      throw error;
    }
  , function() {
    console.log('timer complete');
  }
  );

})(d3, Rx);
