'use strict';

var hex = hex || {};

hex.highlight = (function dataSimulator(d3, Rx) {
  var highlightedHexagon;

  var getHighlightedHexagon = function() {
    return highlightedHexagon;
  }

  var highlight = function(index) {
    if (highlightedHexagon) {
      unhighlight();
    }
    var perspective = 1.5
      , duration = 200
      , zoom = (hex.board.hexboard.honeycomb.size + 25) / hex.board.hexboard.honeycomb.size;

    var p = hex.board.hexboard.points[index];
    highlightedHexagon = hex.board.hexboard.svg.insert('path');
    var sketchId = hex.board.createSketchId(p);
    highlightedHexagon
      .attr('class', 'hexagon highlight')
      .attr('d', 'm' + hex.board.hexagon(hex.board.hexboard.honeycomb.size).join('l') + 'z')
      .attr('transform', 'translate(' + p.x + ',' + p.y + ')')
      .attr('fill', 'url(#' + sketchId + ')')
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
    .attr('transform', 'translate(' + p.x + ',' + p.y + ')')
    .remove();
  }

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

  var getCandidates = function(currentPoint) {
    return hex.board.hexboard.points.filter(function(point) {
      if (currentPoint && currentPoint.id === point.id) {
        return true;
      }
      if (point.sketch && point.sketch.length > 0) {
        return hex.winner.isAllowedToWin(point);
      } else {
        return false;
      };
    });
  }

  var moveHighlightHorizontally = function(direction) {  // -1 left, +1 right
    var currentPoint = highlightedHexagon ? highlightedHexagon.datum() : null;
    var candidates = getCandidates(currentPoint);
    if (candidates.length < 1) {
      return;
    };
    var currentIndex = highlightedHexagon ? candidates.indexOf(currentPoint) : null;
    var start = direction > 0 ? 0 : candidates.length - 1
      , end = direction > 0 ? candidates.length - 1 : 0;
    var newIndex;
    if (currentIndex === null || currentIndex === end) {
      newIndex = start;
    } else {
      newIndex = currentIndex + direction * 1;
    }
    return candidates[newIndex].id;
  };

  var moveHighlightVertically = function(direction) { // -1 up, +1 down
    var currentPoint = highlightedHexagon ? highlightedHexagon.datum() : null;
    var candidates = getCandidates(currentPoint);
    if (candidates.length < 1) {
      return;
    };
    var start = direction > 0 ? 0 : candidates.length - 1
      , end = direction > 0 ? candidates.length - 1 : 0;
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

  return {
    moveHighlightHorizontally: moveHighlightHorizontally
  , moveHighlightVertically: moveHighlightVertically
  , highlight: highlight
  , unhighlight: unhighlight
  , getHighlightedHexagon: getHighlightedHexagon
  }
})(d3, Rx);
