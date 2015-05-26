'use strict';

var hex = hex || {};

hex.winner = (function dataSimulator(d3, Rx) {
  Rx.Observable.fromEvent(d3.select('#winners').node(), 'click').tap(function() {
    pickWinners();
    stageWinners();
  }).subscribeOnError(hex.ui.errorObserver);

  // Returns a random integer between min included) and max (excluded)
  var getRandomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  };

  var winners = [];

  var isAlreadyWinner = function(point) {
    return winners.some(function(winner) {
      return 'cuid' in winner.doodle && winner.doodle.cuid === point.doodle.cuid;
    });
  };

  var pickWinner = function(index) {
    if (arguments.length === 0) {
      var highlightedHexagon = hex.highlight.getHighlightedHexagon();
      if (!highlightedHexagon) {
        return;
      }
      else index = highlightedHexagon.datum().id;
    }
    if (winners.length >= 10) {
      return;
    }
    if (winners.some(function(point) { return point.id === index })) {
      console.log('Doodle ', index, ' already a winner');
      return;
    }
    console.log('picking winner', index);
    var winner = hex.ui.points[index];
    winners.push(winner);
    stageWinner(winner, winners.length - 1);
  };

  var pickWinners = function() {
    var numWinners = 10;
    var candidates = hex.ui.points.filter(function(point) {
      return point.doodle;
    });

    d3.range(numWinners - winners.length).map(function(currentValue, index) {
      var index = getRandomInt(0, candidates.length);
      winners.push(candidates[index]);
      candidates = candidates.filter(function(point) {
        return ! isAlreadyWinner(point);
      });
    });
  };

  var stageSpots = d3.range(10).map(function(spot, index) {
    return {
      x: (Math.floor(index / 5) * 2 - 1) * (hex.ui.honeycomb.dimensions.x / 2 + 50) + hex.ui.content.x/2
    , y: hex.ui.content.y / 2 + 10 * hex.ui.honeycomb.spacing.y / 2 * (index % 5 - 2)
    }
  });

  var winnerSpots = d3.range(10).map(function(spot, index) {
    var c = {x: hex.ui.content.x / 2, y: hex.ui.content.y / 2}
      , delta = {x: hex.ui.honeycomb.dimensions.x/4, y: hex.ui.honeycomb.dimensions.y/3}
      , offset = {x: 0, y: - 0.17}  // an adjustment to make room for the names

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
  }

  var stageWinner = function(p, index) {
    animateWinner(p, p, stageSpots[index], 0.5, 1, false, function() {
      if (winners.length === 10 && index === 9) {
        hex.ui.dispose();
        hex.controls.dispose();
        hex.highlight.unhighlight();
        displayWinners();
      }
    });
  }

  var displayWinner = function(p, index) {
    animateWinner(p, stageSpots[index], winnerSpots[index], 0.4, 1.3, true);
    console.log('Winner name:', p.doodle.name, 'cuid:', p.doodle.cuid, 'submission:', p.doodle.submissionId);
  }

  var animateWinner = function(p, p0, p1, zoom1, zoom2, shownames, cb) {
    var duration = 1000
      , scale = 0.2;
      ;
    var spaceIndex = p.doodle.name.indexOf(' ');
    p.doodle.firstname = p.doodle.name.substring(0,spaceIndex);
    p.doodle.lastname = p.doodle.name.substring(spaceIndex+1);

    if (!p.group) {
      p.group = hex.ui.svg.insert('g')
        .attr('class', 'winner')
        .attr('transform', function(d) { return 'translate(' + p0.x + ',' + p0.y + ')'; });

      p.group.insert('path')
        .attr('class', 'hexagon')
        .attr('d', 'm' + hex.ui.hexagon(hex.ui.honeycomb.size/scale).join('l') + 'z')
        .attr('fill', 'url(#img' + p.id + ')')
        .attr('transform', 'matrix('+zoom1+', 0, 0, '+zoom1+', 0, 0)');
    }

    if (shownames) {
      var textWidth = hex.ui.honeycomb.size * 3.5
        , textHeight = hex.ui.honeycomb.size * 1.3;
      var textGroup = p.group.insert('g')
        .attr('class', 'text')
        .attr('transform', 'matrix('+1/zoom1+', 0, 0, '+1/zoom1+', 0, '+ hex.ui.honeycomb.size/zoom1 * 1.5 +')')
      textGroup.insert('rect')
        .attr('width', textWidth)
        .attr('height', textHeight)
        .attr('x', -textWidth / 2)
        .attr('y', -hex.ui.honeycomb.size / 2.2)
        .attr('rx', 3)
        .attr('ry', 3);

      textGroup.insert('text')
        .attr('class', 'firstname')
        .attr('text-anchor', 'middle')
        .text(p.doodle.firstname);

      textGroup.insert('text')
        .attr('class', 'lastname')
        .attr('text-anchor', 'middle')
        .attr('y', hex.ui.honeycomb.size / 1.5)
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

  return {
    pickWinner: pickWinner
  , isAlreadyWinner: isAlreadyWinner
  }
})(d3, Rx);
