'use strict';

var hex = hex || {};

hex = (function dataSimulator(d3, Rx) {
  var errorObserver = function(error) {
    console.error(error.stack || error);
  };

  var display = {
    x: Math.max(document.documentElement.clientWidth, window.innerWidth) || 1920
  , y: Math.max(document.documentElement.clientHeight, window.innerHeight) - 4 - 39
  };
  var honeycomb = {
    size: 20
  };
  honeycomb.spacing = {
      x: honeycomb.size * 2 * Math.sin(Math.PI*2/3)
    , y: honeycomb.size * (1 + Math.cos(Math.PI/3))
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

  var content = {
    x: display.x - margin.left - margin.right
  , y: display.y - margin.top - margin.bottom
  };

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
    .domain([0, 1, 2, 3, 4])  // 5 states
    .range(['#002235', '#004368', '#00659c', '#0088ce', '#39a5dc']);

  var svg = d3.select('.map').append('svg')
      .attr('width', content.x + margin.left + margin.right)
      .attr('height', content.y + margin.top + margin.bottom)
    .append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      ;

  var defs = svg.append('defs');

  svg.append('clipPath')
      .attr('id', 'clip')
    .append('rect')
      .attr('class', 'mesh')
      .attr('width', content.x)
      .attr('height', content.y);

  var hexagons = svg.append('g')
      .attr('clip-path', 'url(#clip)')
    .selectAll('.hexagon')
      .data(points)
    .enter().append('path')
      .attr('class', 'hexagon')
      .attr('d', 'm' + hexagon(honeycomb.size).join('l') + 'z')
      .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
      .style('fill', function(d) { return color(0); });

  function particle(p, stage) {
    var c = {x: content.x / 2, y: content.y / 2};
    var perspective = 1.5
      , duration = 500
      , scale = 0.4
      , opacity = { initial: 0.01, final: 0.9};
    var p0 = {x: perspective * (p.x - c.x) + c.x, y: perspective * (p.y - c.y) + c.y};
    var newColor = color(stage);
    svg.insert('path')
      .attr('class', 'hexagon')
      .attr('d', 'm' + hexagon(honeycomb.size/scale).join('l') + 'z')
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
    var c = {x: content.x / 2, y: content.y / 2};
    var perspective = 0.5
      , duration = 1000
      , scale = 0.2
    var p0 = {x: perspective * (p.x - c.x) + c.x, y: perspective * (p.y - c.y) + c.y};

    var imgsize = (honeycomb.size * 2) / scale;
    var pattern = defs.append('pattern')
      .attr('id', 'img' + p.id)
      .attr('class', 'doodle')
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

    doodle.pattern = pattern;
    p.doodle = doodle;

    svg.insert('path')
      .datum(p)
      .attr('class', 'hexagon doodle')
      .attr('d', 'm' + hexagon(honeycomb.size/scale).join('l') + 'z')
      .attr('transform', function(d) { return 'translate(' + p0.x + ',' + p0.y + ')'; })
      .style('fill-opacity', 1.0)
      .attr('fill', 'url(#img' + p.id + ')')
    .transition()
      .duration(duration)
      .ease('quad-in')
      .attr('transform', 'matrix('+scale+', 0, 0, '+scale+', '+ p.x +', '+ p.y +')');
  }

  Rx.Observable.fromEvent(d3.select('#push-doodles').node(), 'click').subscribe(function() {
    var xhr = d3.xhr('/api/doodle/random/10', function(err, res) {
      console.log(err || res);
    });
  });

  var messages = Rx.DOM.fromWebSocket(d3demo.config.backend.ws + '/thousand', null, hex.ping)
  .map(function(messageEvent) {
    return JSON.parse(messageEvent.data);
  }).share();

  messages.filter(function(message) {
    return message.type === 'event';
  })
  .tap(function(message) {
    var event = message.data;
    particle(points[event.id], event.stage);
  }).subscribeOnError(errorObserver);

  messages.filter(function(message) {
    return message.type === 'doodle';
  })
  .tap(function(message) {
    var doodle = message.data;
    image(points[doodle.containerId], doodle);
  }).subscribeOnError(errorObserver);

  return {
    errorObserver: errorObserver
  , messages: messages
  , honeycomb: honeycomb
  , content: content
  , points: points
  , hexagon: hexagon
  , svg: svg
  }

})(d3, Rx);
