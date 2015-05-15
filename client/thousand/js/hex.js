'use strict';

var hex = hex || {};

hex = (function dataSimulator(d3, Rx) {
  var errorObserver = function(error) {
    console.error(error.stack || error);
  };

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
    .domain([0, 1, 2, 3, 4])  // 5 states
    .range(['#002235', '#004368', '#00659c', '#0088ce', '#39a5dc']);

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
    var p0 = {x: perspective * (p.x - c.x) + c.x, y: perspective * (p.y - c.y) + c.y};

    var imgsize = (size * 2) / scale;
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
      .attr('class', 'hexagon doodle')
      .attr('d', 'm' + hexagon(size/scale).join('l') + 'z')
      .attr('transform', function(d) { return 'translate(' + p0.x + ',' + p0.y + ')'; })
      .style('fill-opacity', 1.0)
      .attr('fill', 'url(#img' + p.id + ')')
    .transition()
      .duration(duration)
      .ease('quad-in')
      .attr('transform', 'matrix('+scale+', 0, 0, '+scale+', '+ p.x +', '+ p.y +')');
  }

  var highlightedHexagon;

  var highlight = function(index) {
    if (highlightedHexagon) {
      unhighlight();
    }
    var perspective = 1.5
      , duration = 200
      , scale = 0.2
      , zoom = 0.5;

    var p = points[index];
    highlightedHexagon = svg.insert('path');
    highlightedHexagon
      .attr('class', 'hexagon highlight')
      .attr('d', 'm' + hexagon(size/scale).join('l') + 'z')
      .attr('transform', 'matrix('+scale+', 0, 0, '+scale+', '+ p.x +', '+ p.y +')')
      .attr('fill', 'url(#img' + p.id + ')')
      .style('fill-opacity', 1.0)
      .datum(p)
    .transition()
      .duration(duration)
      .ease('quad-out')
      .attr('transform', 'matrix('+zoom+', 0, 0, '+zoom+', '+ p.x +', '+ p.y +')');
  };

  var unhighlight = function() {
    if (! highlightedHexagon) {
      return;
    };
    var perspective = 1.5
      , duration = 200
      , scale = 0.2;
    var p = highlightedHexagon.datum();
    highlightedHexagon
    .transition()
    .duration(duration)
    .ease('quad-out')
    .attr('transform', 'matrix('+scale+', 0, 0, '+scale+', '+ p.x +', '+ p.y +')')
    .remove();
  }

  var moveHighlightHorizontally = function(direction) {  // -1 left, +1 right
    var candidates = points.filter(function(point) {
      return !!point.doodle;
    });
    if (candidates.length < 1) {
      return;
    }
    var start = direction > 0 ? 0 : candidates.length - 1
      , end = direction > 0 ? candidates.length - 1 : 0;
    var currentIndex = highlightedHexagon ? candidates.indexOf(highlightedHexagon.datum()) : null;
    var newIndex;
    if (currentIndex === null || currentIndex === end) {
      newIndex = start;
    } else {
      newIndex = currentIndex + direction * 1;
    }
    return candidates[newIndex].id;
  };

  var moveHighlightVertically = function(direction) { // -1 up, +1 down
    var candidates = points.filter(function(point) {
      return !!point.doodle;
    });
    if (candidates.length < 1) {
      return;
    }
    var start = direction > 0 ? 0 : candidates.length - 1
      , end = direction > 0 ? candidates.length - 1 : 0;
    var currentPoint = highlightedHexagon ? highlightedHexagon.datum() : null;
    var newId;
    if (! highlightedHexagon) {
      newId = candidates[start].id;
    } else {
      var yCandidates = candidates.filter(function(point) {
        return direction * (point.y - currentPoint.y) > 0;
      });
      var closest;
      if (yCandidates.length === 0) {
        closest = closestHexagonInRow(currentPoint, candidates, candidates[start].y);
      } else {
        var yStart = direction > 0 ? 0 : yCandidates.length - 1
        var closest = closestHexagonInRow(currentPoint, yCandidates, yCandidates[yStart].y);
      }
      newId = closest.id;
    };
    return newId;
  };

  var closestHexagonInRow = function(currentPoint, yCandidates, y) {
    var y2Candidates = yCandidates.filter(function(point) {
      return point.y === y;
    });
    var closest = y2Candidates[0];
    y2Candidates.forEach(function(closer) {
      if (Math.abs(closer.x - currentPoint.x) < Math.abs(closest.x - currentPoint.x)) {
        closest = closer;
      }
    });
    return closest;
  }

  Rx.Observable.fromEvent(document.getElementsByTagName('body')[0], 'keyup')
  .filter(function(event) {
    return [37, 38, 39, 40, 13].some(function(keyCode) {
      return keyCode == event.keyCode;
    });
  })
  .tap(function(event) {
    var newId;
    switch(event.keyCode) {
      case 37: // LEFT
        newId = moveHighlightHorizontally(-1);
        console.log(newId)
        highlight(newId);
        break;
      case 38: // UP
        newId = moveHighlightVertically(-1);
        console.log(newId)
        highlight(newId);
        break;
      case 39: // RIGHT
        newId = moveHighlightHorizontally(1);
        console.log(newId)
        highlight(newId);
        break;
      case 40: // DOWN
        newId = moveHighlightVertically(1);
        console.log(newId)
        highlight(newId);
        break;
      case 13: // ENTER
        pickWinner(highlightedHexagon.datum().id)
        break;
    };
  })
  .subscribeOnError(errorObserver);

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  Rx.Observable.fromEvent(d3.select('#push-doodles').node(), 'click').subscribe(function() {
    var xhr = d3.xhr('/api/doodle/random/10', function(err, res) {
      console.log(err || res);
    });
  });

  Rx.Observable.fromEvent(d3.select('#winners').node(), 'click').tap(function() {
    winners = winners || pickWinners();
    displayWinners(winners);
  }).subscribeOnError(errorObserver);

  Rx.Observable.fromEvent(d3.select('#stage').node(), 'click').tap(function() {
    winners = pickWinners();
    stageWinners(winners);
  }).subscribeOnError(errorObserver);

  var pickWinner = function(index) {
    if (winners.length >= 10) {
      return;
    }
    if (winners.some(function(point) { return point.id === index })) {
      console.log('Doodle ', index, ' already a winner');
      return;
    }
    console.log('picking winner', index);
    var winner = points[index];
    winners.push(winner);
    stageWinner(winner, winners.length - 1);
  };

  var winners = [];

  var pickWinners = function() {
    var numWinners = 10;
    var candidates = points.filter(function(point) {
      return point.doodle;
    });

    var winners = d3.range(numWinners).map(function(currentValue, index) {
      var index = getRandomInt(0, candidates.length);
      return candidates.splice(index, 1)[0];
    });

    return winners;
  };

  var stageSpots = d3.range(10).map(function(spot, index) {
    return {
      x: (Math.floor(index / 5) * 2 -1) * (honeycomb.dimensions.x / 2 + 50) + width/2
    , y: height / 2 + 10 * honeycomb.spacing.y / 2 * (index % 5 - 2)
    }
  });

  console.log(stageSpots);

  var winnerSpots = d3.range(10).map(function(spot, index) {
    var c = {x: width / 2, y: height / 2}
      , delta = {x: honeycomb.dimensions.x/4, y: honeycomb.dimensions.y/3}
      , offset = {x: 0, y: - 0.17}  // an adjustment to make room for the names

    if (index <= 2) {
      return {
        x: c.x + (index % 3 - 1) * delta.x,
        y: c.y + (Math.floor(index / 3) - 1 + offset.y) * delta.y
      };
    } else if (index <= 6) {
      return {
        x: c.x + (index % 4 - 2 + 0.5) * delta.x,
        y: c.y + offset.y * delta.y
      };
    } else {
      return {
        x: c.x + ((index - 1) % 3 - 1) * delta.x,
        y: c.y + (Math.floor((index - 1) / 3) - 1 + offset.y) * delta.y
      };
    }
  });

  var stageWinners = function(winners) {
    winners.forEach(function(p, index) {
      if (p) {
        stageWinner(p, index);
      }
    });
  }

  var displayWinners = function(winners) {
    winners.forEach(function(p, index) {
      if (p) {
        displayWinner(p, index);
      }
    });
  }

  var stageWinner = function(p, index) {
    animateWinner(p, p, stageSpots[index], 0.5, 1, false, function() {
      if (winners.length === 10) {
        unhighlight();
        displayWinners(winners);
      }
    });
  }

  var displayWinner = function(p, index) {
    animateWinner(p, stageSpots[index], winnerSpots[index], 0.4, 1.3, true);
  }

  var animateWinner = function(p, p0, p1, zoom1, zoom2, shownames, cb) {
    var duration = 1000
      , scale = 0.2;
      ;
    var spaceIndex = p.doodle.name.indexOf(' ');
    p.doodle.firstname = p.doodle.name.substring(0,spaceIndex);
    p.doodle.lastname = p.doodle.name.substring(spaceIndex+1);

    if (!p.group) {
      p.group = svg.insert('g')
        .attr('class', 'winner')
        .attr('transform', function(d) { return 'translate(' + p0.x + ',' + p0.y + ')'; });

      p.group.insert('path')
        .attr('class', 'hexagon')
        .attr('d', 'm' + hexagon(size/scale).join('l') + 'z')
        .attr('fill', 'url(#img' + p.id + ')')
        .attr('transform', 'matrix('+zoom1+', 0, 0, '+zoom1+', 0, 0)');
    }

    if (shownames) {
      var textWidth = size * 3.5
        , textHeight = size * 1.3;
      var textGroup = p.group.insert('g')
        .attr('class', 'text')
        .attr('transform', 'matrix('+1/zoom1+', 0, 0, '+1/zoom1+', 0, '+ size/zoom1 * 1.5 +')')
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
    }

    p.group.transition()
      .duration(duration)
      .ease('quad-out')
      .attr('transform', 'matrix('+zoom2+', 0, 0, '+zoom2+', '+ p1.x +', '+ p1.y +')')
      .each('end', function() {
        if (cb) {
          cb();
        }
      });
  }

var openObserver = Rx.Observer.create(function(open) {
  var ws = open.target;
  var lastPong = new Date().getTime();
  var ttl = 5000;
  var pinger = Rx.Observable.interval(ttl)
  var ping = JSON.stringify({
    type: 'ping'
  });
  Rx.Observable.interval(ttl)
  .tap(function() {
    if (ws.readyState === ws.OPEN) {
      ws.send(ping);
      console.log(">>> PING");
      if (new Date().getTime() - lastPong > ttl * 3) {
        ws.close();
        throw new Error('Server has gone more than ' + 3 * ttl + 'ms without a response');
      }
    };
    ws.onmessage = function(messageEvent) {
      var message = JSON.parse(messageEvent.data);
      if (message.type === 'pong') {
        lastPong = new Date().getTime();
        console.log("<<< PONG");
      }
    };
  })
  .subscribeOnError(errorObserver);
});

var messages = Rx.DOM.fromWebSocket(d3demo.config.backend.ws + '/thousand', null, openObserver)
.map(function(messageEvent) {
  return JSON.parse(messageEvent.data);
}).share();

messages.filter(function(message) {
  return message.type === 'winner';
}).tap(function(message) {
  var doodlesPresent = points.some(function(point) {
    return !! point.doodle;
  });
  if (! doodlesPresent) {
    return;
  }
  var action = message.data;
  console.log('Winner action: ', action);
  var newId;
  switch (action) {
    case 'left':
      newId = moveHighlightHorizontally(-1);
      console.log(newId)
      highlight(newId);
      break;
    case 'right':
      newId = moveHighlightHorizontally(1);
      console.log(newId)
      highlight(newId);
      break;
    case 'up':
      newId = moveHighlightVertically(-1);
      console.log(newId)
      highlight(newId);
      break;
    case 'down':
      newId = moveHighlightVertically(1);
      console.log(newId)
      highlight(newId);
      break;
    case 'pick':
      if (highlightedHexagon) {
        pickWinner(highlightedHexagon.datum().id)
        console.log('pick a winner')
      };
      break;
  };
}).subscribeOnError(errorObserver);

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

})(d3, Rx);
