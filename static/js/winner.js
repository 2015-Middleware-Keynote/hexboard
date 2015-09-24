'use strict';

var hex = hex || {};

hex.winner = (function dataSimulator(d3, Rx) {
  Rx.Observable.fromEvent(d3.select('#winners').node(), 'click').tap(function() {
    pickWinners();
    stageWinners();
  }).subscribeOnError(hex.feed.errorObserver);

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  var numWinners = hex.config.winner_count;
  var winners = [];

  var isAllowedToWin = function(point, exclusions) {
    if ( ! (point.sketch && point.sketch.length > 0) ) {
      return false;
    }
    var sketch = point.sketch[point.sketch.length - 1];
    if (!sketch.cuid) {
      console.log('Sketch has no cuid:', sketch);
      return false;
    }
    var alreadyWinner = winners.some(function(winner) {
      var winnerSketch = winner.sketch[winner.sketch.length - 1];
      return 'cuid' in winnerSketch && winnerSketch.cuid === sketch.cuid;
    });
    var excluded = false;
    if (!alreadyWinner && exclusions) {
      excluded = exclusions.some(function(exclusion) {
        var excludedSketch = exclusion.sketch[exclusion.sketch.length - 1];
        return 'cuid' in excludedSketch && excludedSketch.cuid === sketch.cuid;
      });
    }
    return ! alreadyWinner && ! excluded;
  };

  var pickWinner = function(index) {
    if (arguments.length === 0) {
      var highlightedHexagon = hex.highlight.getHighlightedHexagon();
      if (!highlightedHexagon) {
        return;
      }
      else index = highlightedHexagon.datum().id;
    }
    if (winners.length >= numWinners) {
      return;
    }
    if (winners.some(function(point) { return point.id === index })) {
      console.log('Doodle ', index, ' already a winner');
      return;
    }
    console.log('picking winner', index);
    var winner = hex.board.hexboard.points[index];
    if (!winner.sketch) {
      return;
    };
    winners.push(winner);
    stageWinner(winner, winners.length - 1);
  };

  var pickWinners = function() {
    var candidates = hex.board.hexboard.points.filter(function(point) {
      return point.sketch;
    });

    var thisWinners = [];

    d3.range(numWinners - winners.length).map(function(currentValue, index) {
      if (candidates.length === 0) {
        return;
      };
      var index = getRandomInt(0, candidates.length);
      thisWinners.push(candidates[index]);
      hex.controls.winnerSocket.onNext(JSON.stringify({key: 'test', msg: {action: 'pick', value: candidates[index].id}}));
      candidates = candidates.filter(function(point) {
        return isAllowedToWin(point, thisWinners);
      });
    });
  };

  var stageSpots, winnerSpots, zoom = {};

  var init = function() {
    zoom.stage = (hex.board.hexboard.content.y / 5) / (2 * hex.board.hexboard.honeycomb.size);
    zoom.winner = (hex.board.hexboard.content.y / 3) / (2 * hex.board.hexboard.honeycomb.size);
    stageSpots = d3.range(numWinners).map(function(spot, index) {
      if (hex.board.hexboard.content.aspect === 'wide') {
        var offsetMultiplier = Math.floor(index / 5) === 0 ? 1/4 : 1/2;
        var offset = (offsetMultiplier + (zoom.stage - 1) / 2) * hex.board.hexboard.honeycomb.spacing.x;
        return {
          x: (Math.floor(index / 5) * 2 - 1) * (hex.board.hexboard.content.x/2 + offset + 20) + hex.board.hexboard.content.x/2
        , y: hex.board.hexboard.content.y / 2 + hex.board.hexboard.content.y / 5 * (index % 5 - 2)
        }
      } else {
        return {
          x: hex.board.hexboard.content.x / 2 + hex.board.hexboard.content.x / 5 * (index % 5 - 2)
        , y: (Math.floor(index / 5) * 2 - 1) * (hex.board.hexboard.honeycomb.dimensions.y / 2 + 50) + hex.board.hexboard.content.y/2
        }
      }
    });

    winnerSpots = d3.range(numWinners).map(function(spot, index) {
      var c = {x: hex.board.hexboard.content.x / 2, y: hex.board.hexboard.content.y / 2}
        , delta = {x: hex.board.hexboard.honeycomb.dimensions.x/4, y: hex.board.hexboard.honeycomb.dimensions.y/3.5}
        , offset = {x: 0, y: 0}  // an adjustment to make room for the names

      if (index <= 2) {
        return {
          x: c.x + (index - 1) * delta.x,
          y: c.y + (Math.floor(index / 3) - 1 + offset.y) * delta.y
        };
      } else if (index <= 6) {
        return {
          x: c.x + (index - 4.5) * delta.x,
          y: c.y + offset.y * delta.y
        };
      } else {
        return {
          x: c.x + (index - 8) * delta.x,
          y: c.y + (Math.floor((index - 1) / 3) - 1 + offset.y) * delta.y
        };
      }
    });
  }

  var stageWinners = function() {
    winners.forEach(function(p, index) {
      if (p) {
        stageWinner(p, index);
      }
    });
  }

  var displayWinners = function() {
    winners.forEach(function(p, index) {
      if (p) {
        displayWinner(p, index);
      }
    });
    logWinners(winners);
  }

  var logWinners = function(winners) {
    var winningSketches = winners.map(function(winner) {
      return winner.sketch[winner.sketch.length - 1];
    })
    var data = JSON.stringify(winningSketches);
    console.log(data);
    var xhr = d3.xhr('/api/winners');
    xhr.header('Content-Type', 'application/json');
    xhr.send('PUT', data, function(err, res) {
      console.log('winningSketches logged');
      console.log(err || res);
    });
  }

  var stageWinner = function(p, index) {
    animateWinner(p, p, stageSpots[index], 1, zoom.stage, false, function() {
      if (winners.length === numWinners && index === (numWinners - 1)) {
        hex.feed.dispose();
        hex.controls.dispose();
        hex.highlight.unhighlight();
        displayWinners();
      }
    });
  }

  var displayWinner = function(p, index) {
    animateWinner(p, stageSpots[index], winnerSpots[index], 1, zoom.winner, false);
    var sketch = p.sketch[p.sketch.length - 1];
    console.log('Winner name:', sketch.name, 'cuid:', sketch.cuid, 'submission:', sketch.submissionId, 'sketch:', sketch.url);
  }

  var animateWinner = function(p, p0, p1, zoom1, zoom2, shownames, cb) {
    var duration = 1000;
    var sketch = p.sketch[p.sketch.length - 1];
    var spaceIndex = sketch.name.indexOf(' ');
    sketch.firstname = sketch.name.substring(0,spaceIndex);
    sketch.lastname = sketch.name.substring(spaceIndex+1);
    var sketchId = hex.board.createSketchId(p);

    if (!p.group) {
      p.group = hex.board.hexboard.svg.insert('g')
        .attr('class', 'winner')
        .attr('transform', function(d) { return 'translate(' + p0.x + ',' + p0.y + ')'; });

      p.group.insert('path')
        .attr('class', 'hexagon')
        .attr('d', 'm' + hex.board.hexagon(hex.board.hexboard.honeycomb.size).join('l') + 'z')
        .attr('fill', 'url(#' + sketchId + ')')
        .attr('transform', 'matrix('+zoom1+', 0, 0, '+zoom1+', 0, 0)');
    }

    if (shownames) {
      var textWidth = hex.board.hexboard.honeycomb.size * 3.5
        , textHeight = hex.board.hexboard.honeycomb.size * 1.3;
      var textGroup = p.group.insert('g')
        .attr('class', 'text')
        .attr('transform', 'matrix('+1/zoom1+', 0, 0, '+1/zoom1+', 0, '+ hex.board.hexboard.honeycomb.size/zoom1 * 1.5 +')')
      textGroup.insert('rect')
        .attr('width', textWidth)
        .attr('height', textHeight)
        .attr('x', -textWidth / 2)
        .attr('y', -hex.board.hexboard.honeycomb.size / 2.2)
        .attr('rx', 3)
        .attr('ry', 3);

      textGroup.insert('text')
        .attr('class', 'firstname')
        .attr('text-anchor', 'middle')
        .text(sketch.firstname);

      textGroup.insert('text')
        .attr('class', 'lastname')
        .attr('text-anchor', 'middle')
        .attr('y', hex.board.hexboard.honeycomb.size / 1.5)
        .text(sketch.lastname);
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

  return {
    pickWinner: pickWinner
  , isAllowedToWin: isAllowedToWin
  , init: init
  }
})(d3, Rx);
