'use strict';

var hex = hex || {};

hex.inspect = (function dataSimulator(d3, Rx) {
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
      .attr('class', 'hexagon inspect')
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
  };

  return {
    highlight: highlight
  , unhighlight: unhighlight
  , getHighlightedHexagon: getHighlightedHexagon
  }
})(d3, Rx);
