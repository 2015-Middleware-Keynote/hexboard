'use strict';

var hex = hex || {};

hex.board = (function board(d3, Rx) {
  var errorObserver = function(error) {
    console.error(error.stack || error);
  };

  var hexboard = {
    firstImage: true
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
  };

  var color = function(point) {
    if (point.stage === 5 && hexboard.firstImage && hex.shadowman) {
      return 'url(#redhat'+point.id+')';
    }
    return colorScale(point.stage);
  };

  var colorScale = d3.scale.linear()
    .domain([0, 1, 2, 3, 4, 5])  // 5 states
    .range(['#39a5dc', '#0088ce', '#00659c', '#004368', '#002235', '#000000']);

  var init = function() {
    var honeycomb = hexboard.honeycomb;
    var display = {
      x: Math.max(document.documentElement.clientWidth, window.innerWidth) || 1920
    , y: Math.max(document.documentElement.clientHeight, window.innerHeight) - 4 - 39
    };
    var aspect = display.x / display.y > honeycomb.cols / honeycomb.rows ? 'wide' : 'narrow';

    var minMargin = { x: 25, y: 25 };
    // Leave space for staging the winners
    if (aspect === 'narrow') {
      minMargin.y += 100;
    } else {
      minMargin.x += 100;
    }

    var legendHeight = document.querySelector('.legend').clientHeight;
    var navbarHeight = document.querySelector('.navbar').clientHeight;

    var maxContent = {
      x: display.x - 2 * minMargin.x
    , y: display.y - 2 * minMargin.y - legendHeight - navbarHeight
    };

    var maxSpacing = {
      x: maxContent.x / (honeycomb.cols + 1)
    , y: maxContent.y / (honeycomb.rows + 1)
    }

    var minSize = {
      x: maxSpacing.x / (2 * Math.sin(Math.PI*2/3))
    , y: maxSpacing.y / (1 + Math.cos(Math.PI/3))
    }

    honeycomb.size = Math.min(minSize.x, minSize.y);

    honeycomb.spacing = {
        x: honeycomb.size * 2 * Math.sin(Math.PI*2/3) + .5
      , y: honeycomb.size * (1 + Math.cos(Math.PI/3)) + .5
    };

    honeycomb.dimensions = {
      x: (honeycomb.cols + 3/4) * honeycomb.spacing.x
    , y: (honeycomb.rows + 1) * honeycomb.spacing.y
    };

    var margin = {
        top: 1/2 * (display.y - honeycomb.dimensions.y - legendHeight - navbarHeight)
      , right: 1/2 * (display.x - honeycomb.dimensions.x)
      , bottom: 1/2 * (display.y - honeycomb.dimensions.y - legendHeight - navbarHeight)
      , left: 1/2 * (display.x - honeycomb.dimensions.x)
    };

    var content = {
      x: honeycomb.dimensions.x
    , y: honeycomb.dimensions.y
    , aspect: aspect
    };

    var points
    if (!hexboard.points) {
      points = d3.range(honeycomb.count).map(function(currentValue, index) {
        var x_i =  (index % honeycomb.cols) + 0.75
          , y_i = (Math.floor(index / honeycomb.cols)) + 1;
        if (y_i % 2 !== 0) {
          x_i = x_i + 0.5
        }
        var x = honeycomb.spacing.x * x_i;
        var y = honeycomb.spacing.y * y_i;
        return {id: index, x: x, y: y, stage: 0, skecthCount: 0};
      });
    } else {
      points = hexboard.points;
      points.forEach(function(p, index) {
        var x_i =  (index % honeycomb.cols) + 1
          , y_i = (Math.floor(index / honeycomb.cols)) + 1;
        if (y_i % 2 !== 0) {
          x_i = x_i + 0.5
        }
        p.x = honeycomb.spacing.x * x_i;
        p.y = honeycomb.spacing.y * y_i;
      })
    }
    var svgContainer = d3.select('.svg-container');

    var oldSvg = svgContainer.select('svg');
    if (oldSvg) {
      oldSvg.remove();
    };

    var svg = svgContainer.append('svg')
        .attr('width', content.x + margin.left + margin.right)
        .attr('height', content.y + margin.top + margin.bottom)
      .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        ;

    var defs = svg.append('defs');

    points.forEach(function(point) {
      var pattern = defs.append('pattern')
        .attr('id', 'redhat' + point.id)
        .attr('class', 'shadowman')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', honeycomb.size*2)
        .attr('height', honeycomb.size*2)
        .attr('x', -honeycomb.size)
        .attr('y', -honeycomb.size);

      pattern.append('rect')
        .attr('width', honeycomb.dimensions.x)
        .attr('height', honeycomb.dimensions.y)
        .attr('x', -point.x + honeycomb.size)
        .attr('y', -point.y + honeycomb.size);

      pattern.append('image')
        .attr('xlink:href', '/img/redhat.svg')
        .attr('width', (honeycomb.cols - 1) * honeycomb.spacing.x)
        .attr('height', (honeycomb.rows - 1) * honeycomb.spacing.y)
        .attr('x', -point.x + 2 * honeycomb.spacing.x)
        .attr('y', -point.y + 1.5 * honeycomb.spacing.y);
    });

    svg.append('clipPath')
        .attr('id', 'clip')
      .append('rect')
        .attr('class', 'mesh')
        .attr('width', content.x)
        .attr('height', content.y);

    var hexagons = svg.append('g')
        .attr('clip-path', 'url(#clip)')
      .selectAll('.hexagon').data(points)

    hexagons
      .enter().append('path')
        .attr('class', 'hexagon')
        .attr('d', 'm' + hexagon(honeycomb.size).join('l') + 'z')
        .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
        .style('fill', function(d) { return color(d); })
        .append('title').text(function(d) {return d.title})

    hexboard.honeycomb = honeycomb;
    hexboard.content = content;
    hexboard.points = points;
    hexboard.hexagons = hexagons;
    hexboard.svg = svg;
    hexboard.defs = defs;

    points.forEach(function(point) {
      if (point.stage === 5) {
        hexagons.filter(function(d) { return d.x === point.x && d.y === point.y; })
          .classed('clickable', true);
      };
      if (point.sketch && point.sketch.length) {
        var skecthId = createSketchId(point);
        var sketch = point.sketch[point.sketch.length - 1];
        createBackground(sketch, skecthId);
        hexagons.filter(function(d) { return d.x === point.x && d.y === point.y; })
          .classed({'hexagon': true, 'sketch': true})
          .style('fill', function(d) { return 'url(#' + skecthId + ')'; });
      };
    });
  };

  function flipAll() {
    var duration = 1000;

    hexboard.hexagons
      .transition()
      .duration(duration)
      .ease('cubic-in-out')
      .attrTween('transform', function(d, i, a) {
        return function(t) {
          var scale = 1-4*t*(1-t);
          return 'matrix('+scale+', 0, 0, 1, '+ d.x +', '+ d.y +')'
        }
      })
      .styleTween('fill', function(point, i, a) {
        return function(t) {
          if (point.sketch) {
            var skecthId = createSketchId(point);
            return t < 0.5 ? a : 'url(#' + skecthId + ')';
          } else {
            return t < 0.5 ? a : color(point);
          }
        };
      });
  }

  function particle(pod) {
    var point = hexboard.points[parseInt(pod.id)]
    var c = {x: hexboard.content.x / 2, y: hexboard.content.y / 2};
    var perspective = 1.5
      , duration = 500
      , scale = 0.4
      , opacity = { initial: 0.01, final: 0.9};
    var p0 = {x: perspective * (point.x - c.x) + c.x, y: perspective * (point.y - c.y) + c.y};
    point.stage = pod.stage;
    point.name = pod.name;
    point.url = pod.url;
    hexboard.svg.insert('path')
      .attr('class', 'hexagon falling')
      .attr('d', 'm' + hexagon(hexboard.honeycomb.size).join('l') + 'z')
      .attr('transform', function(d) { return 'matrix('+1/scale+', 0, 0, '+1/scale+', '+ p0.x +', '+ p0.y +')'; })
      .style('fill', function(d) { return color(point); })
      .style('fill-opacity', opacity.initial)
    .transition()
      .duration(duration)
      .ease('quad-out')
      .attr('transform', 'translate(' + point.x + ',' + point.y + ')')
      .style('fill-opacity', opacity.final)
      .remove();
    hexboard.hexagons.filter(function(d) { return d.x === point.x && d.y === point.y; })
      .transition()
      .duration(duration)
      .ease('linear')
      .styleTween('fill', function(d, i, a) {
        var fill = d.sketch ? a : color(d);
        return function(t) {
          return t < 1 ? a : fill;
        };
      })
      .each('end', function() {
        var element = d3.select(this);
        element.select('title').text(point.name);
        var p = element.datum();
        if (p.stage === 5) {
          element.classed('clickable', true);
        }
      })
  };

  var createSketchId = function(point) {
    return 'img' + point.id + '_' + point.currentSketch;
  }

  var createBackground = function(sketch, id) {
    var imgsize = (hexboard.honeycomb.size * 2);
    var pattern = hexboard.defs.append('pattern')
      .attr('id', id)
      .attr('class', 'sketch')
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
      .attr('xlink:href', sketch.uiUrl)
      .attr('width', imgsize)
      .attr('height', imgsize)
      .attr('x', 0)
      .attr('y', 0);
  }

  var image = function(point, sketch, animate) {
    console.log('Adding sketch:', sketch.submissionId, 'for cuid: ', sketch.cuid);
    var c = {x: hexboard.content.x / 2, y: hexboard.content.y / 2};
    var perspective = 0.5
      , duration = animate ? 1000 : 0
      , scale = (hexboard.content.y / 2) / (2 * hexboard.honeycomb.size)
    var p0 = {x: perspective * (point.x - c.x) + c.x, y: perspective * (point.y - c.y) + c.y};

    point.sketch = point.sketch || [];
    point.currentSketch = ++point.skecthCount;
    point.sketch.push(sketch);
    var skecthId = createSketchId(point);
    createBackground(sketch, skecthId);

    if (animate) {
      hexboard.svg.insert('path')
        .datum(point)
        .attr('class', 'hexagon sketch falling')
        .attr('d', 'm' + hexagon(hexboard.honeycomb.size).join('l') + 'z')
        .attr('transform', function(d) { return 'matrix('+scale+', 0, 0, '+scale+', '+ p0.x +', '+ p0.y +')'})
        .style('fill-opacity', 1.0)
        .attr('fill', 'url(#' + skecthId + ')')
      .transition()
        .duration(duration)
        .ease('quad-in')
        .attr('transform', 'translate(' + point.x + ',' + point.y + ')')
        .remove();

      hexboard.hexagons.filter(function(d) { return d.x === point.x && d.y === point.y; })
        .transition()
        .duration(duration)
        .ease('linear')
        .each('end', function() {
          d3.select(this).classed({'hexagon': true, 'sketch': true});
        })
        .attr('transform', function(d) {return 'matrix(1, 0, 0, 1, '+ d.x +', '+ d.y +')'}) // finish off any half-flipped hexagons
        .styleTween('fill', function(d, i, a) {
          return function(t) {
            return t < 1 ? a : 'url(#' + skecthId + ')';
          };
        });
      } else {
        hexboard.hexagons.filter(function(d) { return d.x === point.x && d.y === point.y; })
          .classed({'hexagon': true, 'sketch': true})
          .attr('transform', function(d) {return 'matrix(1, 0, 0, 1, '+ d.x +', '+ d.y +')'}) // finish off any half-flipped hexagons
          .style('fill', function(d) { return 'url(#' + skecthId + ')'; });
      }
  };

  var removeSketch = function(point) {
    hex.inspect.unhighlight();
    point.currentSketch--;
    point.sketch.pop();
    hexboard.hexagons.filter(function(d) { return d.x === point.x && d.y === point.y; })
      .style('fill', function(d) { return d.sketch.length ? 'url(#' + createSketchId(d) + ')' : color(d)})
      .classed('sketch', function(d) { return d.sketch.length > 0});
  };

  var clear = function(point) {
    point.sketch = [];
    hexboard.hexagons.filter(function(d) { return d.x === point.x && d.y === point.y; })
      .style('fill', function(d) { return color(d)})
      .classed('sketch', false);
  }

  return {
    errorObserver: errorObserver
  , hexboard: hexboard
  , hexagon: hexagon
  , flipAll: flipAll
  , removeSketch: removeSketch
  , createSketchId: createSketchId
  , image: image
  , clear: clear
  , init: init
  , particle: particle
  }

})(d3, Rx);
