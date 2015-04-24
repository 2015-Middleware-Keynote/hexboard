'use strict';

var hex = hex || {};

hex = (function dataSimulator(d3, Rx) {

  var size = 20;
  var display = {
    x: Math.max(document.documentElement.clientWidth, window.innerWidth) || 1920
  , y: Math.max(document.documentElement.clientHeight, window.innerHeight) - 4 - 39
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
        return {id: index, x: x, y: y, stage: 0};
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

  var defs = svg.append('defs');

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

  function particle(p, stage) {
    var c = {x: width / 2, y: height / 2};
    var perspective = 1.5
      , duration = 500
      , scale = 0.4
      , opacity = { initial: 0.01, final: 0.9};
    var p0 = {x: perspective * (p.x - c.x) + c.x, y: perspective * (p.y - c.y) + c.y};
    var newColor = color(stage);
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

  function image(p, doodle) {
    var c = {x: width / 2, y: height / 2};
    var perspective = 0.5
      , duration = 1000
      , scale = 0.2
      , opacity = { initial: 0.01, final: 0.9};
    var p0 = {x: perspective * (p.x - c.x) + c.x, y: perspective * (p.y - c.y) + c.y};

    var imgsize = (size * 2) / scale;
    var pattern = defs.append('pattern')
      .attr('id', 'big_img' + p.id)
      .attr('class', 'doodle falling')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', imgsize)
      .attr('height', imgsize)
      .attr('x', imgsize/2)
      .attr('y', imgsize/2);

    pattern.append('rect')
      .attr('width', imgsize)
      .attr('height', imgsize)
      .attr('x', 0)
      .attr('y', 0);


    pattern.append('image')
      .attr('xlink:href', doodle.url)
      .attr('width', imgsize)
      .attr('height', imgsize)
      .attr('x', 0)
      .attr('y', 0);

    imgsize = size *2;
    pattern = defs.append('pattern')
      .attr('id', 'img' + p.id)
      .attr('class', 'doodle tile')
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('width', imgsize)
      .attr('height', imgsize)
      .attr('x', imgsize/2)
      .attr('y', imgsize/2);

    pattern.append('image')
      .attr('xlink:href', doodle.url)
      .attr('width', imgsize)
      .attr('height', imgsize)
      .attr('x', 0)
      .attr('y', 0);

    doodle.pattern = pattern;
    p.doodle = doodle;

    svg.insert('path')
      .attr('class', 'hexagon')
      .attr('d', 'm' + hexagon(size/scale).join('l') + 'z')
      .attr('transform', function(d) { return 'translate(' + p0.x + ',' + p0.y + ')'; })
      .attr('fill', 'url(#big_img' + p.id + ')')
    .transition()
      .duration(duration)
      .ease('quad-in')
      .attr('transform', 'matrix('+scale+', 0, 0, '+scale+', '+ p.x +', '+ p.y +')');
  }

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  var pickWinners = function() {
    var numWinners = 6;
    var candidates = points.filter(function(point) {
      return point.doodle;
    });

    var winners = d3.range(numWinners).map(function(currentValue, index) {
      var index = getRandomInt(0, candidates.length);
      return candidates.splice(index, 1)[0];
    });

    return winners;
  };

  Rx.Observable.fromEvent(d3.select('#winners').node(), 'click').subscribe(function() {
    var winners = pickWinners();
    var c = {x: width / 2, y: height / 2};
    var perspective = 1.5
      , duration = 1000
      , scale = 0.2
      , opacity = { initial: 0.01, final: 0.9};

    var winnerSpots = d3.range(6).map(function(spot, index) {
      return {
        x: c.x + (index % 3 - 1) * honeycomb.dimensions.x/3,
        y: c.y + (Math.floor(index / 3) * 2 - 1 - 0.3) * honeycomb.dimensions.y/4 // the 0.2 is an adjustment to make room for the names
      }
    });
    console.log(winnerSpots);

    winners.forEach(function(p, index) {
      if (!p) {
        return;
      }
      var p0 = winnerSpots[index];
      var group = svg.insert('g')
        .attr('class', 'winner')
        .attr('transform', function(d) { return 'translate(' + p.x + ',' + p.y + ')'; });

      group.insert('path')
        .attr('class', 'hexagon')
        .attr('d', 'm' + hexagon(size).join('l') + 'z')
        .attr('fill', 'url(#img' + p.id + ')')

      var textGroup = group.insert('g')
        .attr('class', 'text')
        .attr('transform', function(d) { return 'translate(0,' + size * 1.5 + ')'; });

      var textWidth = size * 3.5
        , textHeight = size * 1.3;
      textGroup.insert('rect')
        .attr('width', textWidth)
        .attr('height', textHeight)
        .attr('x', -textWidth / 2)
        .attr('y', -size / 2.2)
        .attr('rx', 3)
        .attr('ry', 3);

      textGroup.insert('text')
        .attr('class', 'firstname')
        .attr('text-anchor', 'middle')
        .text(p.doodle.firstname);

      textGroup.insert('text')
        .attr('class', 'lastname')
        .attr('text-anchor', 'middle')
        .attr('y', size / 1.5)
        .text(p.doodle.lastname);

      group.transition()
        .duration(duration)
        .ease('quad-out')
        .attr('transform', 'matrix('+1/scale+', 0, 0, '+1/scale+', '+ p0.x +', '+ p0.y +')');
    });
  });

var events = Rx.DOM.fromWebSocket(d3demo.config.backend.ws + '/thousand')
.tap(function(messageEvent) {
  var message = JSON.parse(messageEvent.data);
  // console.log(message);
  if (message.type === 'event') {
    var event = message.data;
    // console.log(event);
    particle(points[event.id], event.stage);
  }
  if (message.type === 'doodle') {
    var doodle = message.data;
    image(points[doodle.containerId], doodle);
  }
})
.subscribeOnError(function(error) {
  console.error(error.stack);
});

})(d3, Rx);
